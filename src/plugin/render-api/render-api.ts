import { MarkdownRendererOptions } from "./api-options";
import { App, Component, Notice, WorkspaceLeaf, MarkdownRenderer as ObsidianRenderer, MarkdownPreviewView, loadMermaid, TFile, MarkdownView, View, TAbstractFile, TFolder } from "obsidian";
import { TabManager } from "src/plugin/utils/tab-manager";
import * as electron from 'electron';
import { Settings, SettingsPage } from "src/plugin/settings/settings";
import { Path } from "src/plugin/utils/path";
import { SimpleFileListGenerator } from "src/plugin/features/simple-list-generator";
import { DataviewRenderer } from "./dataview-renderer";
import { Utils } from "../utils/utils";
import { IconHandler } from "../utils/icon-handler";
import ObsidianApp from "src/shared/app";

export namespace MarkdownRendererAPI {
	export const viewableMediaExtensions = ["png", "jpg", "jpeg", "svg", "gif", "bmp", "ico", "mp4", "mov", "avi", "webm", "mpeg", "mp3", "wav", "ogg", "aac", "pdf", "html", "htm", "json", "txt", "yaml"];
	export const convertableExtensions = ["md", "base", ...viewableMediaExtensions]; // drawing is an alias for excalidraw

	export function extensionToTag(extension: string) {
		if (["png", "jpg", "jpeg", "svg", "gif", "bmp", "ico"].includes(extension)) return "img";
		else if (["mp4", "mov", "avi", "webm", "mpeg"].includes(extension)) return "video";
		else if (["mp3", "wav", "ogg", "aac"].includes(extension)) return "audio";
		else if (["pdf"].includes(extension)) return "embed";
		else return "iframe";
	}

	export async function renderFile(file: TFile, options?: MarkdownRendererOptions): Promise<{ contentEl: HTMLElement; viewType: string; } | undefined> {
		options = Object.assign(new MarkdownRendererOptions(), options);
		const result = await _MarkdownRendererInternal.renderFile(file, options);
		if (!result) return;
		await _MarkdownRendererInternal.postProcessHTML(result.contentEl, options);
		return result;
	}

	export async function renderMarkdownSimple(markdown: string): Promise<string | undefined> {
		const container = document.body.createDiv();
		await _MarkdownRendererInternal.renderSimpleMarkdown(markdown, container);
		const text = container.innerHTML;
		container.remove();
		return text;
	}

	export async function renderMarkdownSimpleEl(markdown: string, container: HTMLElement) {
		await _MarkdownRendererInternal.renderSimpleMarkdown(markdown, container);
	}

	export function isConvertable(extension: string) {
		if (extension.startsWith(".")) extension = extension.substring(1);
		return this.convertableExtensions.contains(extension);
	}

	export function checkCancelled(): boolean {
		return _MarkdownRendererInternal.checkCancelled();
	}

	export async function beginBatch(options?: MarkdownRendererOptions) {
		options = Object.assign(new MarkdownRendererOptions(), options);
		await _MarkdownRendererInternal.beginBatch(options);
	}

	export function endBatch() {
		_MarkdownRendererInternal.endBatch();
		ExportLog.resetProgress();
	}
}

export namespace _MarkdownRendererInternal {
	export let overlayProgress: boolean = true;
	export let renderLeaf: WorkspaceLeaf | undefined;
	export let electronWindow: electron.BrowserWindow | undefined;
	export let errorInBatch: boolean = false;
	export let cancelled: boolean = false;
	export let batchStarted: boolean = false;
	let logContainer: HTMLElement | undefined;
	let loadingContainer: HTMLElement | undefined;
	let fileListContainer: HTMLElement | undefined;

	export const batchDocument = document.implementation.createHTMLDocument();
	let markdownView: MarkdownView | undefined;

	const infoColor = "var(--text-normal)";
	const warningColor = "var(--color-yellow)";
	const errorColor = "var(--color-red)";
	const infoBoxColor = "rgba(0,0,0,0.15)"
	const warningBoxColor = "rgba(var(--color-yellow-rgb), 0.15)";
	const errorBoxColor = "rgba(var(--color-red-rgb), 0.15)";
	export const arrowHTML = "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='svg-icon right-triangle'><path d='M3 8L12 17L21 8'></path></svg>";

	export function checkCancelled(): boolean {
		if (_MarkdownRendererInternal.cancelled || !_MarkdownRendererInternal.renderLeaf) {
			ExportLog.log("cancelled");
			_MarkdownRendererInternal.endBatch();
			return true;
		}

		return false;
	}

	async function delay(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async function waitUntil(condition: () => boolean, timeout: number = 1000, interval: number = 100): Promise<boolean> {
		if (condition()) return true;

		return new Promise((resolve, reject) => {
			let timer = 0;
			const intervalId = setInterval(() => {
				if (condition()) {
					clearInterval(intervalId);
					resolve(true);
				} else {
					timer += interval;
					if (timer >= timeout) {
						clearInterval(intervalId);
						resolve(false);
					}
				}
			}, interval);
		});
	}

	function failRender(file: TFile | undefined, message: any): undefined {
		if (checkCancelled()) return undefined;

		ExportLog.error(message, `Rendering ${file?.path ?? " custom markdown "} failed: `);
		return;
	}

	export async function renderFile(file: TFile, options: MarkdownRendererOptions): Promise<{ contentEl: HTMLElement, viewType: string } | undefined> {
		if (MarkdownRendererAPI.viewableMediaExtensions.contains(file.extension)) {
			return { contentEl: await createMediaPage(file, options), viewType: "attachment" };
		}

		const loneFile = !batchStarted;
		if (loneFile) {
			ExportLog.log("Exporting single file, starting batch");
			await _MarkdownRendererInternal.beginBatch(options);
		}

		const success = await waitUntil(() => renderLeaf !== undefined || checkCancelled(), 2000, 1);
		if (!success || !renderLeaf) return failRender(file, "Failed to get leaf for rendering!");

		let html: HTMLElement | undefined;

		try {
			await renderLeaf.openFile(file, { active: false });
		}
		catch (e) {
			return failRender(file, e);
		}

		const view = renderLeaf.view;
		const viewType = view.getViewType();

		switch (viewType) {
			case "markdown":
				// @ts-ignore
				const preview = view.previewMode;
				html = await renderMarkdownView(preview, options);
				break;
			default:
				html = await renderGeneric(view, options);
				break;
		}

		if (checkCancelled()) return undefined;
		if (!html) return failRender(file, "Failed to render file!");

		if (loneFile) _MarkdownRendererInternal.endBatch();

		return { contentEl: html, viewType: viewType };
	}

	export async function renderMarkdownView(preview: MarkdownPreviewView, options: MarkdownRendererOptions): Promise<HTMLElement | undefined> {
		// @ts-ignore
		if (preview.show)
			// @ts-ignore
			preview.show();

		// @ts-ignore
		const renderer: any = preview.renderer;

		try {
			await renderer.unfoldAllHeadings();
			await renderer.unfoldAllLists();
			await renderer.parseSync();
		} catch (e) {
			ExportLog.error(e, "Failed to unfold or parse renderer!");
		}

		// @ts-ignore
		if (!window.mermaid) {
			await loadMermaid();
		}

		const sections = renderer.sections as {
			rendered: boolean;
			height: number;
			computed: boolean;
			lines: number;
			lineStart: number;
			lineEnd: number;
			used: boolean;
			highlightRanges: number;
			level: number;
			headingCollapsed: boolean;
			shown: boolean;
			usesFrontMatter: boolean;
			html: string;
			el: HTMLElement;
		}[];

		// @ts-ignore
		const newMarkdownEl = batchDocument.body.createDiv({
			attr: {
				// @ts-ignore
				class: "obsidian-document " + (preview.renderer?.previewEl?.className ?? ""),
			},
		});
		const newSizerEl = newMarkdownEl.createDiv({
			attr: { class: "markdown-preview-sizer markdown-preview-section" },
		});

		if (!newMarkdownEl || !newSizerEl)
			return failRender(preview.file, "Please specify a container element, or enable keepViewContainer!");

		const previewEl: HTMLElement = renderer.previewEl;
		const sizerEl: HTMLElement = previewEl.querySelector(".markdown-preview-sizer") ?? previewEl;
		previewEl.style.minHeight = sizerEl.style.minHeight;

		await Utils.delay(16);

		let rendered = false;
		// @ts-ignore
		preview.renderer.onRendered(() => {
			console.log("Rendered");
			rendered = true;
		});

		// @ts-ignore
		preview.rerender(true);

		await Utils.delay(5);

		previewEl.style.minHeight = sizerEl.style.minHeight;

		await Utils.delay(5);

		// wait for rendering to finish using callback
		let renderSuccess = await waitUntil(
			() => rendered || checkCancelled(),
			2000,
			16
		);
		if (checkCancelled()) return undefined;
		if (!renderSuccess)
			return failRender(preview.file, "Failed to render preview!");

		// @ts-ignore
		const foldedCallouts: HTMLElement[] = [];
		for (const section of sections) {
			// unfold callouts
			const folded = Array.from(
				section.el.querySelectorAll(
					".callout-content[style*='display: none']"
				)
			) as HTMLElement[];
			for (const callout of folded) {
				callout.style.display = "";
			}
			foldedCallouts.push(...folded);
		}

		await Utils.delay(5);

		// wait until the sizer contains all the sections
		ExportLog.log("Waiting for all sections to be counted...");
		await waitUntil(() => {
				console.log(sizerEl.children.length, sections.length);
				return (
					sizerEl.children.length >= sections.length ||
					checkCancelled()
				);
			},
			4000,
			5
		);
		if (checkCancelled()) return undefined;

		await Utils.delay(50);

		// compile dataview
		if (DataviewRenderer.isDataviewEnabled()) {
			const dataviewInfos = DataviewRenderer.getDataViewsFromHTML(preview.containerEl);
			for (const dataviewInfo of dataviewInfos) {
				await new DataviewRenderer(
					preview,
					preview.file,
					dataviewInfo?.query,
					dataviewInfo.keyword
				).generate(dataviewInfo.preEl);
			}
		}

		// wait for transclusions
		ExportLog.log("Waiting for transclusions to render...");
		await waitUntil(
			() =>
				!preview.containerEl.querySelector(".markdown-preview-pusher") ||
				preview.containerEl.querySelector(".markdown-preview-pusher + *") !== null ||
				checkCancelled(),
			2000,
			5
		);
		if (checkCancelled()) return undefined;

		if (
			preview.containerEl.querySelector(".markdown-preview-pusher") &&
			!preview.containerEl.querySelector(".markdown-preview-pusher + *")
		) {
			ExportLog.warning("Transclusions were not rendered correctly in file " + preview.file.name + "!");
		}

		// wait for generic plugins
		ExportLog.log("Waiting for generic plugins to render...");
		await waitUntil(
			() =>
				!preview.containerEl.querySelector(
					"[class^='block-language-']:empty"
				) || checkCancelled(),
			2000,
			16
		);
		if (checkCancelled()) return undefined;

		// check for invalid plugin blocks
		const invalidPluginBlocks = Array.from(
			preview.containerEl.querySelectorAll(
				"[class^='block-language-']:empty"
			)
		);
		for (const block of invalidPluginBlocks) {
			ExportLog.warning(
				`Plugin element ${
					block.className ||
					block.parentElement?.className ||
					"unknown"
				} from ${preview.file.name} not rendered correctly!`
			);
		}

		// convert canvas elements into images here because otherwise they will lose their data when moved
		const canvases = Array.from(
			preview.containerEl.querySelectorAll(
				"canvas:not(.pdf-embed canvas)"
			)
		) as HTMLCanvasElement[];
		for (const canvas of canvases) {
			// wait until the canvas is rendered
			ExportLog.log("Waiting for canvas-based plugin to render...");
			let canvasSuccess = await waitUntil(
				() => canvas.toDataURL().length > 100 || checkCancelled(),
				1000,
				16
			);
			if (!canvasSuccess) continue;

			const data = canvas.toDataURL();

			const image = batchDocument.body.createEl("img");
			image.src = data;
			image.style.width = canvas.style.width || "100%";
			image.style.maxWidth = "100%";
			canvas.replaceWith(image);
		}

		// refold callouts
		for (const callout of foldedCallouts) {
			callout.style.display = "none";
		}

		newSizerEl.empty();

		newSizerEl.innerHTML = sizerEl.innerHTML;

		// get banner plugin banner and insert it before the sizer element
		const banner = preview.containerEl.querySelector(
			".obsidian-banner-wrapper"
		);
		if (banner) {
			newSizerEl.before(banner);
		}

		options.container?.appendChild(newMarkdownEl);

		if (options.unifyTitleFormat) {
			let title = await _MarkdownRendererInternal.getTitleForFile(
				preview.file
			);
			let icon = await _MarkdownRendererInternal.getIconForFile(
				preview.file
			);
			let iconSVG =
				(await MarkdownRendererAPI.renderMarkdownSimple(icon.icon)) ??
				icon.icon;
			_MarkdownRendererInternal.addTitle(
				options.container ?? newMarkdownEl,
				title.title,
				title.isDefault,
				iconSVG,
				icon.isDefault,
				preview.file,
				options
			);
		}

		return newMarkdownEl;
	}

	export async function renderSimpleMarkdown(markdown: string, container: HTMLElement) {
		const renderComp = new Component();
		renderComp.load();
		await ObsidianRenderer.render(ObsidianApp.app, markdown, container, "/", renderComp);
		renderComp.unload();

		const renderedEl = container.children[container.children.length - 1];
		if (renderedEl && renderedEl.tagName === "P") {
			renderedEl.outerHTML = renderedEl.innerHTML; // remove the outer <p> tag
		}

		// remove tags
		container.querySelectorAll("a.tag").forEach((element: HTMLAnchorElement) => {
			element.remove();
		});

		//remove rendered lists and replace them with plain text
		container.querySelectorAll("ol").forEach((listEl: HTMLElement) => {
			if (listEl.parentElement) {
				const start = listEl.getAttribute("start") ?? "1";
				listEl.parentElement.createSpan().outerHTML = `${start}. ${listEl.innerText}`;
				listEl.remove();
			}
		});
		container.querySelectorAll("ul").forEach((listEl: HTMLElement) => {
			if (listEl.parentElement) {
				listEl.parentElement.createSpan().innerHTML = "- " + listEl.innerHTML;
				listEl.remove();
			}
		});
		container.querySelectorAll("li").forEach((listEl: HTMLElement) => {
			if (listEl.parentElement) {
				listEl.parentElement.createSpan().innerHTML = listEl.innerHTML;
				listEl.remove();
			}
		});
	}

	async function renderGeneric(view: View, options: MarkdownRendererOptions): Promise<HTMLElement | undefined> {
		await delay(2000);

		if (checkCancelled()) return undefined;

		// @ts-ignore
		const contentEl = view.contentEl.cloneNode(true);
		options.container?.appendChild(contentEl);

		return contentEl;
	}

	export async function getIconForFile(file: TAbstractFile): Promise<{ icon: string; isDefault: boolean }> {
		if (!file) return { icon: "", isDefault: true };

		let iconOutput = "";
		let iconProperty: string | undefined = "";
		let useDefaultIcon = false;
		let useFile = file;

		if (useFile instanceof TFolder) {
			// look for icon property on a file inside the folder with the same name as the folder
			let childFile = ObsidianApp.app.vault.getFileByPath(file.path + "/" + file.name + ".md");
			if (childFile) useFile = childFile;
		}

		if (useFile instanceof TFile) {
			const fileCache = ObsidianApp.app.metadataCache.getFileCache(useFile);
			const frontmatter = fileCache?.frontmatter;
			iconProperty = frontmatter?.icon ?? frontmatter?.sticker ?? frontmatter?.banner_icon; // banner plugin support
		}

		iconOutput = await IconHandler.getIcon(iconProperty ?? "");

		// add iconize icon as frontmatter if iconize exists
		const isUnchangedNotEmojiNotHTML = (iconProperty === iconOutput && iconOutput.length < 40) && !/\p{Emoji}/u.test(iconOutput) && !iconOutput.includes("<") && !iconOutput.includes(">");
		let parsedAsIconize = false;

		//@ts-ignore
		if ((useDefaultIcon || !iconProperty || isUnchangedNotEmojiNotHTML) && app?.plugins?.enabledPlugins?.has("obsidian-icon-folder")) {
			//@ts-ignore
			const fileToIconName = ObsidianApp.app.plugins.plugins['obsidian-icon-folder'].data;
			const noteIconsEnabled = fileToIconName.settings.iconsInNotesEnabled ?? false;

			// only add icon if rendering note icons is enabled
			// bectheause that is what we rely on to get  icon
			if (noteIconsEnabled) {
				const iconIdentifier = fileToIconName.settings.iconIdentifier ?? ":";
				let iconProperty = fileToIconName[file.path];

				if (iconProperty && typeof iconProperty !== "string") {
					iconProperty = iconProperty.iconName ?? "";
				}

				if (iconProperty && typeof iconProperty === "string" && iconProperty.trim() !== "") {
					if (file instanceof TFile)
						ObsidianApp.app.fileManager.processFrontMatter(file, (frontmatter) => {
							frontmatter.icon = iconProperty;
						});

					let emojiMatch = iconProperty.trim().match(/\p{Emoji}/u);
					let isEmoji = emojiMatch && emojiMatch.length === 1 && emojiMatch.index === 0;

					if (isEmoji) iconOutput = iconProperty;
					else iconOutput = iconIdentifier + iconProperty + iconIdentifier;

					parsedAsIconize = true;
				}
			}
		}

		if (!parsedAsIconize && isUnchangedNotEmojiNotHTML) iconOutput = "";

		return { icon: iconOutput, isDefault: useDefaultIcon };
	}

	export async function getTitleForFile(file: TAbstractFile): Promise<{ title: string; isDefault: boolean }> {
		let title = file.name;
		let isDefaultTitle = true;
		if (file instanceof TFile) {
			const fileCache = ObsidianApp.app.metadataCache.getFileCache(file);
			const frontmatter = fileCache?.frontmatter;
			const titleFromFrontmatter = frontmatter?.[Settings.titleProperty] ?? frontmatter?.["banner_header"]; // banner plugin support
			title = (titleFromFrontmatter ?? file.basename).toString() ?? "";

			if (title.endsWith(".excalidraw")) {
				title = title.substring(0, title.length - 11);
			}

			if (title !== file.basename) {
				isDefaultTitle = false;
			}
		}

		if (file instanceof TFolder) {
			title = file.name;
			isDefaultTitle = true;
		}

		return { title: title, isDefault: isDefaultTitle };
	}

	export async function addTitle(documentRoot: HTMLElement, title: string, isDefaultTitle: boolean, icon: string, isDefaultIcon: boolean, source: TFile, exportOptions: MarkdownRendererOptions) {
		// remove inline title
		const inlineTitle = documentRoot.querySelector(".inline-title");
		inlineTitle?.remove();

		// remove make.md title
		const makeTitle = documentRoot.querySelector(".mk-inline-context");
		makeTitle?.remove();

		// remove mod-header
		const modHeader = documentRoot.querySelector(".mod-header");
		modHeader?.remove();

		// create header and footer
		const sizerElement = documentRoot.querySelector(".markdown-preview-sizer");
		const header = sizerElement?.createDiv({ cls: "header" });
		header?.createDiv({ cls: "data-bar" });
		const footer = sizerElement?.createDiv({ cls: "footer" });
		footer?.createDiv({ cls: "data-bar" });

		if (header) sizerElement?.prepend(header);

		// remove banner header
		documentRoot.querySelector(".banner-header")?.remove();

		// Create h1 inline title
		const titleEl = documentRoot.createEl("h1");
		titleEl.classList.add("page-title", "heading");
		if (document.body.classList.contains("show-inline-title")) titleEl.classList.add("inline-title");
		titleEl.id = title;

		if (exportOptions.addPageIcon) {
			let pageIcon = undefined;
			// Create a div with icon
			if ((icon !== "" && !isDefaultIcon)) {
				pageIcon = documentRoot.createEl("div");
				pageIcon.id = "webpage-icon";
				pageIcon.innerHTML = icon;
			}

			// Insert title into the title element
			await _MarkdownRendererInternal.renderSimpleMarkdown(title, titleEl);

			// remove new lines
			titleEl.innerHTML = titleEl.innerHTML.replace(/\n/g, "");

			if (pageIcon) {
				titleEl.prepend(pageIcon);
			}
		}

		// Insert title into the document
		(header ?? sizerElement)?.prepend(titleEl);
	}

	export async function createMediaPage(file: TFile, options: MarkdownRendererOptions): Promise<HTMLElement> {
		const contentEl = batchDocument.body.createDiv({ attr: { class: "obsidian-document" } });
		const embedType = MarkdownRendererAPI.extensionToTag(file.extension);

		let media = contentEl.createEl(embedType);

		if (media instanceof HTMLVideoElement || media instanceof HTMLAudioElement)
			media.controls = true;

		let path = file.path;
		if (file.extension === "html") {
			let pathObj = new Path(path);
			pathObj.setFileName(pathObj.basename + "-content");
		}
		media.src = file.path;

		options.container?.appendChild(contentEl);
		contentEl.appendChild(media);
		return contentEl;
	}

	export async function postProcessHTML(html: HTMLElement, options: MarkdownRendererOptions) {
		if (!html.classList.contains("obsidian-document")) {
			const viewContainer = (html.classList.contains("view-content") || html.classList.contains("markdown-preview-view")) ? html : html.querySelector(".view-content, .markdown-preview-view");
			if (!viewContainer) {
				ExportLog.error("Failed to find view container in rendered HTML!");
				return;
			}

			viewContainer.classList.add("obsidian-document");
		}

		// remove the extra elements if they are not wanted
		html.querySelectorAll(".mod-header, .mod-footer, .markdown-preview-pusher").forEach((e: HTMLElement) => e.remove());

		// add .heading to every header
		html.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((element: HTMLElement) => {
			element.classList.add("heading");
		});

		// transclusions put a div inside a p tag, which is invalid html. Fix it here
		html.querySelectorAll("p:has(> .inline-embed.markdown-embed)").forEach((element) => {
			const elParent = element.parentElement as HTMLElement;
			const span = batchDocument.body.createEl("span");
			span.style.display = "block";
			span.style.marginBlockStart = "var(--p-spacing)";
			span.style.marginBlockEnd = "var(--p-spacing)";

			span.innerHTML = element.innerHTML;
			element.remove();
			let embed = span.querySelector(".inline-embed.markdown-embed") as HTMLElement;
			embed.innerHTML = elParent.innerHTML;
			elParent.innerHTML = "";
			elParent.appendChild(span);
		});

		// encode all text input values into attributes
		html.querySelectorAll("input[type=text]").forEach((element: HTMLElement) => {
			// @ts-ignore
			element.setAttribute("value", element.value);
			// @ts-ignore
			element.value = "";
		});

		// encode all text area values into text content
		html.querySelectorAll("textarea").forEach((element: HTMLElement) => {
			// @ts-ignore
			element.textContent = element.value;
		});

		// convert all hard coded image / media widths into max widths
		html.querySelectorAll("img, video, .media-embed:has( > :is(img, video))").forEach((element: HTMLElement) => {
			const width = element.getAttribute("width");
			if (width) {
				element.removeAttribute("width");
				element.style.width = (width.trim() !== "") ? (width + "px") : "";
				element.style.maxWidth = "100%";
			}
		});

		// replace obsidian's pdf embeds with normal embeds
		html.querySelectorAll("span.internal-embed.pdf-embed").forEach((pdf: HTMLElement) => {
			const embed = batchDocument.body.createEl("embed");
			embed.setAttribute("src", pdf.getAttribute("src") ?? "");
			embed.style.width = pdf.style.width || '100%';
			embed.style.maxWidth = "100%";
			embed.style.height = pdf.style.height || '800px';

			const container = pdf.parentElement?.parentElement;

			container?.querySelectorAll("*").forEach((el) => el.remove());

			if (container) container.appendChild(embed);
		});

		// remove all MAKE.md elements
		html.querySelectorAll("div[class^='mk-']").forEach((element: HTMLElement) => {
			element.remove();
		});

		// move frontmatter before markdown-preview-sizer
		const frontmatter = html.querySelector(".frontmatter");
		if (frontmatter) {
			const frontmatterParent = frontmatter.parentElement;
			const sizer = html.querySelector(".markdown-preview-sizer");
			if (sizer) {
				sizer.before(frontmatter);
			}
			frontmatterParent?.remove();
		}

		// add lazy loading to iframe elements
		html.querySelectorAll("iframe").forEach((element: HTMLIFrameElement) => {
			element.setAttribute("loading", "lazy");
		});

		// add collapse icons to lists if they don't already have them
		const collapsableListItems = Array.from(html.querySelectorAll("li:has(ul), li:has(ol)"));
		for (const item of collapsableListItems) {
			let collapseIcon = item.querySelector(".collapse-icon");
			if (!collapseIcon) {
				collapseIcon = item.createDiv({ cls: "list-collapse-indicator collapse-indicator collapse-icon" });
				collapseIcon.innerHTML = this.arrowHTML;
				item.prepend(collapseIcon);
			}
		}

		// if the dynamic table of contents plugin is included on this page
		// then parse each list item and render markdown for it
		const tocEls = Array.from(html.querySelectorAll(".block-language-toc.dynamic-toc li > a"));
		for (const element of tocEls) {
			const renderEl = batchDocument.body.createDiv();
			renderSimpleMarkdown(element.textContent ?? "", renderEl);
			element.textContent = renderEl.textContent;
			renderEl.remove();
		}
	}

	export async function beginBatch(options: MarkdownRendererOptions) {
		if (batchStarted) return;

		errorInBatch = false;
		cancelled = false;
		batchStarted = true;
		loadingContainer = undefined;
		logContainer = undefined;
		logShowing = false;
		batchDocument.open();
		if (!batchDocument.body) {
			batchDocument.write("<body></body>");
		}

		renderLeaf = TabManager.openNewTab("tab", "horizontal", true);
		markdownView = new MarkdownView(renderLeaf);

		// @ts-ignore
		const parentFound = await waitUntil(() => (renderLeaf && renderLeaf.parent) || checkCancelled(), 2000, 1);
		if (!parentFound) {
			try {
				renderLeaf.detach();
			}
			catch (e) {
				ExportLog.error(e, "Failed to detach render leaf: ");
			}

			if (!checkCancelled()) {
				new Notice("Error: Failed to create leaf for rendering!");
				throw new Error("Failed to create leaf for rendering!");
			}

			return;
		}

		const obsidianWindow = renderLeaf.view.containerEl.win;
		// @ts-ignore
		electronWindow = obsidianWindow.electronWindow as electron.BrowserWindow;
		electronWindow.webContents.setBackgroundThrottling(false);

		document.body.classList.add("html-export-running");

		if (overlayProgress)
			createLoadingContainer();
	}

	export function cancelExport() {
		if (!batchStarted || cancelled) return;

		cancelled = true;
		endBatch();
	}

	export function endBatch() {
		if (!batchStarted) return;

		document.body.classList.remove("html-export-running");
		electronWindow?.webContents.setBackgroundThrottling(true);

		if (renderLeaf) {
			if (!errorInBatch) {
				ExportLog.log("Closing render window");
				renderLeaf.detach();
			}
			else {
				ExportLog.warning("Error in batch, leaving render window open");
				_reportProgress(1, "Completed with errors", "Please see the log for more details.", errorColor);

				// make sure the button still closes the leaf
				const closebutton = loadingContainer?.querySelector(".html-progress-cancel") as HTMLButtonElement;
				const localRenderLeaf = renderLeaf;
				closebutton.onclick = () => localRenderLeaf?.detach();
				closebutton.textContent = "Close";
			}
		}

		electronWindow?.setProgressBar(-1);

		electronWindow = undefined;
		renderLeaf = undefined;
		loadingContainer = undefined;
		fileListContainer = undefined;

		batchStarted = false;
	}

	function generateLogEl(title: string, message: any, textColor: string, backgroundColor: string): HTMLElement {
		const logEl = batchDocument.body.createEl("div");
		logEl.className = "html-progress-log-item";
		logEl.style.display = "flex";
		logEl.style.flexDirection = "column";
		logEl.style.marginBottom = "2px";
		logEl.style.fontSize = "12px";
		logEl.innerHTML =
			`
		<div class="html-progress-log-title" style="font-weight: bold; margin-left: 1em;"></div>
		<div class="html-progress-log-message" style="margin-left: 2em; font-size: 0.8em;white-space: pre-wrap;"></div>
		`;
		logEl.querySelector(".html-progress-log-title")!.textContent = title;
		logEl.querySelector(".html-progress-log-message")!.textContent = message.toString();

		logEl.style.color = textColor;
		logEl.style.backgroundColor = backgroundColor;
		logEl.style.borderLeft = `5px solid ${textColor}`;
		logEl.style.borderBottom = "1px solid var(--divider-color)";
		logEl.style.borderTop = "1px solid var(--divider-color)";

		return logEl;
	}

	function createLoadingContainer() {
		if (!loadingContainer) {
			loadingContainer = batchDocument.body.createDiv();
			loadingContainer.outerHTML =
				`
			<div class="html-progress-wrapper">
				<div class="html-progress-content">
					<div class="html-progress-inner">
						<h1>Generating HTML</h1>
						<progress class="html-progress-bar" value="0" min="0" max="1"></progress>
						<span class="html-progress-sub"></span>
						<button class="html-progress-cancel">Cancel</button>
					</div>
					<div class="html-progress-log">
						<h1>Export Log</h1>
					</div>
				</div>
			</div>
			`
			loadingContainer = batchDocument.querySelector(".html-progress-wrapper") as HTMLElement;
			let cancelButton = loadingContainer.querySelector(".html-progress-cancel") as HTMLButtonElement;
			cancelButton.onclick = () => cancelExport();

			// @ts-ignore
			renderLeaf.containerEl.before(loadingContainer);
		}
	}

	let logShowing = false;
	function appendLogEl(logEl: HTMLElement) {
		logContainer = loadingContainer?.querySelector(".html-progress-log") ?? undefined;

		if (!logContainer || !renderLeaf) {
			console.error("Failed to append log element, log container or render leaf is undefined!");
			return;
		}

		if (!logShowing) {
			renderLeaf.view.containerEl.win.resizeTo(1000, 500);
			logContainer.style.display = "flex";
			logShowing = true;
		}

		logContainer.appendChild(logEl);
		// @ts-ignore
		logEl.scrollIntoView({ behavior: "instant", block: "end", inline: "end" });
	}

	export async function _reportProgress(fraction: number, message: string, subMessage: string, progressColor: string) {
		if (!batchStarted) return;

		// @ts-ignore
		if (!renderLeaf?.parent?.parent) return;

		// @ts-ignore
		const loadingContainer = renderLeaf.parent.parent.containerEl.querySelector(`.html-progress-wrapper`);
		if (!loadingContainer) return;

		const progressBar = loadingContainer.querySelector("progress");
		if (progressBar) {
			progressBar.value = fraction;
			progressBar.style.backgroundColor = "transparent";
			progressBar.style.color = progressColor;
		}


		const messageElement = loadingContainer.querySelector("h1");
		if (messageElement) {
			messageElement.innerText = message;
		}

		const subMessageElement = loadingContainer.querySelector("span.html-progress-sub") as HTMLElement;
		if (subMessageElement) {
			subMessageElement.innerText = subMessage;
		}

		electronWindow?.setProgressBar(fraction);
	}

	export async function _setFileList(items: string[], options: { icons?: string[] | string, renderAsMarkdown?: boolean, title?: string }) {
		const contaienr = loadingContainer?.querySelector(".html-progress-content") as HTMLElement;
		if (!contaienr) return;

		const fileList = new SimpleFileListGenerator(items, options);
		const fileListEl = await fileList.generate(contaienr);
		contaienr.prepend(fileListEl);
		if (fileListContainer) fileListContainer.remove();
		fileListContainer = fileListEl;
	}

	export async function _reportError(messageTitle: string, message: any, fatal: boolean) {
		if (!batchStarted) return;

		errorInBatch = true;

		// @ts-ignore
		const found = await waitUntil(() => renderLeaf && renderLeaf.parent && renderLeaf.parent.parent, 100, 10);
		if (!found) return;

		appendLogEl(generateLogEl(messageTitle, message, errorColor, errorBoxColor));

		if (fatal) {
			renderLeaf = undefined;
			loadingContainer = undefined;
			logContainer = undefined;
		}
	}

	export async function _reportWarning(messageTitle: string, message: any) {
		if (!batchStarted) return;

		// @ts-ignore
		const found = await waitUntil(() => renderLeaf && renderLeaf.parent && renderLeaf.parent.parent, 100, 10);
		if (!found) return;

		appendLogEl(generateLogEl(messageTitle, message, warningColor, warningBoxColor));
	}

	export async function _reportInfo(messageTitle: string, message: any) {
		if (!batchStarted) return;

		// @ts-ignore
		const found = await waitUntil(() => renderLeaf && renderLeaf.parent && renderLeaf.parent.parent, 100, 10);
		if (!found) return;

		appendLogEl(generateLogEl(messageTitle, message, infoColor, infoBoxColor));
	}
}

export namespace ExportLog {
	export let fullLog: string = "";
	let totalProgress = 1;
	let currentProgress = 0;

	function logToString(message: any, title: string) {
		const messageString = (typeof message === "string") ? message : JSON.stringify(message).replaceAll("\n", "\n\t\t");
		const titleString = title !== "" ? title + "\t" : "";
		const log = `${titleString}${messageString}\n`;
		return log;
	}

	function humanReadableJSON(object: any) {
		// remove any properties starting with info_
		object = SettingsPage.deepCopy(object);
		object = SettingsPage.deepRemoveStartingWith(object, "info_");
		object = SettingsPage.deepRemoveStartingWith(object, "alwaysEnabled");
		object = SettingsPage.deepRemoveStartingWith(object, "featureId");
		const string = JSON.stringify(object, null, 2);
		return string;
	}

	export function log(message: any, messageTitle: string = "") {
		pullPathLogs();

		messageTitle = `[INFO] ${messageTitle}`
		fullLog += logToString(message, messageTitle);

		if (messageTitle !== "") console.log(messageTitle + " ", message);
		else console.log(message);

		if (SettingsPage.loaded && !(Settings.logLevel === "all")) return;

		_MarkdownRendererInternal._reportInfo(messageTitle, message);
	}

	export function warning(message: any, messageTitle: string = "") {
		pullPathLogs();

		messageTitle = `[WARNING] ${messageTitle}`
		fullLog += logToString(message, messageTitle);

		if (messageTitle !== "") console.warn(messageTitle + " ", message);
		else console.warn(message);

		if (SettingsPage.loaded && !["warning", "all"].contains(Settings.logLevel)) return;

		_MarkdownRendererInternal._reportWarning(messageTitle, message);
	}

	export function error(message: any, messageTitle: string = "", fatal: boolean = false) {
		pullPathLogs();

		messageTitle = (fatal ? "[FATAL ERROR] " : "[ERROR] ") + messageTitle;
		fullLog += logToString(message, messageTitle);

		if (fatal && messageTitle === "Error") messageTitle = "Fatal Error";
		if (messageTitle !== "") console.error(messageTitle + " ", message);
		else console.error(message);

		if (SettingsPage.loaded && !fatal && !["error", "warning", "all"].contains(Settings.logLevel)) return;

		_MarkdownRendererInternal._reportError(messageTitle, message, fatal);
	}

	export function addToProgressCap(progress: number) {
		totalProgress += progress;
	}

	export function resetProgress() {
		totalProgress = 1;
		currentProgress = 0;
	}

	export function progress(progressBy: number, message: string, subMessage: string, progressColor: string = "var(--interactive-accent)") {
		currentProgress += progressBy;
		setProgress(currentProgress / totalProgress, message, subMessage, progressColor);
	}

	export function setProgress(fraction: number, message: string, subMessage: string, progressColor: string = "var(--interactive-accent)") {
		fullLog += logToString({ fraction, message, subMessage }, "Progress");
		pullPathLogs();
		_MarkdownRendererInternal._reportProgress(fraction, message, subMessage, progressColor);
	}

	export function setFileList(items: string[], options: { icons?: string[] | string, renderAsMarkdown?: boolean, title?: string }) {
		_MarkdownRendererInternal._setFileList(items, options);
	}

	function pullPathLogs() {
		const logs = Path.dequeueLog();
		for (const thisLog of logs) {
			switch (thisLog.type) {
				case "info":
					log(thisLog.message, thisLog.title);
					break;
				case "warn":
					warning(thisLog.message, thisLog.title);
					break;
				case "error":
					error(thisLog.message, thisLog.title, false);
					break;
				case "fatal":
					error(thisLog.message, thisLog.title, true);
					break;
			}
		}
	}

	export function getDebugInfo() {
		let debugInfo = "";

		debugInfo += `Log:\n${fullLog}\n\n`;

		debugInfo += `Settings:\n${humanReadableJSON({ ...Settings })}\n\n`;

		// @ts-ignore
		const loadedPlugins = Object.values(ObsidianApp.app.plugins.plugins).filter((plugin) => plugin._loaded === true).map((plugin) => plugin.manifest.name).join("\n\t");
		debugInfo += `Enabled Plugins:\n\t${loadedPlugins}`;

		return debugInfo;
	}

	export function testThrowError(chance: number) {
		if (Math.random() < chance) {
			throw new Error("Test error");
		}
	}

	export function isCancelled() {
		return _MarkdownRendererInternal.checkCancelled();
	}
}


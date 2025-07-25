import { Attachment } from "src/plugin/utils/downloadable";
import { TAbstractFile, TFile, TFolder } from "obsidian";
import { Settings } from "src/plugin/settings/settings";
import { Path } from "src/plugin/utils/path";
import { ExportLog, MarkdownRendererAPI } from "src/plugin/render-api/render-api";
import { AssetLoader } from "src/plugin/asset-loaders/base-asset";
import { AssetType, InlinePolicy, Mutability } from "src/plugin/asset-loaders/asset-types.js";
import { ExportPipelineOptions } from "src/plugin/website/pipeline-options.js";
import { Index as WebsiteIndex } from "src/plugin/website/index";
import { WebpageTemplate } from "./webpage-template";
import { AssetHandler } from "src/plugin/asset-loaders/asset-handler";
import { Webpage } from "./webpage";
import { Utils } from "src/plugin/utils/utils";

export class Website {
	public destination: Path;
	public index: WebsiteIndex;

	private sourceFiles: TFile[] = [];

	public webpageTemplate: WebpageTemplate;
	public exportOptions: ExportPipelineOptions;

	constructor(destination: Path | string, options?: ExportPipelineOptions) {
		if (typeof destination == "string") destination = new Path(destination);
		this.exportOptions = Object.assign(Settings.exportOptions, options);
		if (!destination.isDirectoryFS) throw new Error("Website destination must be a folder: " + destination.path);
		this.destination = destination;
	}

	private async buildTemplate(): Promise<void> {
		const template = this.webpageTemplate;
		await template.loadLayout();

		// inject custom head content
		if (this.exportOptions.customHeadOptions.enabled) {
			let string = AssetHandler.customHeadContent.getHTML(this.exportOptions);
			template.insertFeatureString(string, this.exportOptions.customHeadOptions);
		}
	}

	private findCommonRootPath(files: { path: string }[]): string {
		if (!files || files.length === 0) {
			return '';
		}

		if (files.length === 1) {
			return new Path(files[0].path).parent?.path ?? '';
		}

		const paths = files.map(file => new Path(file.path).split());
		let commonPath: string[] = [];
		const shortestPathLength = Math.min(...paths.map(p => p.length));

		for (let i = 0; i < shortestPathLength; i++) {
			const segment = paths[0][i];
			if (paths.every(path => path[i] === segment)) {
				commonPath.push(segment);
			} else {
				break;
			}
		}

		// If the common path is just the root, return an empty string
		if (commonPath.length <= 1) {
			return '';
		}

		// Remove the last segment if it's not a common parent for all files
		const lastCommonSegment = commonPath[commonPath.length - 1];
		if (!paths.every(path => path.length > commonPath.length || path[commonPath.length - 1] !== lastCommonSegment)) {
			commonPath.pop();
		}

		return commonPath.length > 0 ? new Path(commonPath.join("/")).path : '';
	}

	public async load(files?: TFile[]): Promise<this> {
		ExportLog.resetProgress();
		ExportLog.addToProgressCap((files?.length ?? 0));
		ExportLog.addToProgressCap((files?.length ?? 0) * 0.1);

		this.sourceFiles = files?.filter((file) => file) ?? [];

		let rootPath = this.findCommonRootPath(this.sourceFiles);
		console.log("Root path: " + rootPath);

		await AssetHandler.reloadAssets(this.exportOptions);
		this.index = new WebsiteIndex();
		try {
			await this.index.load(this, this.exportOptions);
		} catch (error) {
			ExportLog.error(error, "Problem loading index");
		}

		try {
			this.webpageTemplate = new WebpageTemplate(this.exportOptions);
		} catch (error) {
			ExportLog.error(error, "Problem creating webpage template");
		}

		// create webpages
		for (const file of this.sourceFiles) {
			try {
				let webpage = new Webpage(file, file.name, this, this.exportOptions);
				await this.index.addFile(webpage);

				ExportLog.progress(0.1, "Initializing Document", file.path, "var(--color-yellow)");
				await Utils.delay(0);
			}
			catch (error) {
				ExportLog.error(error, "Problem initializing document: " + file.path);
				continue;
			}
		}

		return this;
	}

	/**
	 * Create a new website with the given files and options.
	 * @param files The files to include in the website.
	 * @param destination The folder to export the website to.
	 * @param options The api options to use for the export.
	 * @returns The website object.
	 */
	public async build(files?: TFile[]): Promise<Website | undefined> {
		if (files) await this.load(files);

		await this.buildTemplate();

		await MarkdownRendererAPI.beginBatch(this.exportOptions);
		this.validateSettings();

		let webpages = this.index.webpages;

		const downloads = AssetHandler.getDownloads(this.destination, this.exportOptions);
		this.index.addFiles(downloads);

		for (const webpage of webpages) {
			if (ExportLog.isCancelled()) return;

			ExportLog.progress(1, "Building Webpages", webpage.source.path);

			const rendered = await webpage.renderDocument();
			if (!rendered) continue;
			await Utils.delay(0);

			const attachments = await webpage.getAttachments();
			await Utils.delay(0);
			this.index.addFiles(attachments);
			await Utils.delay(0);

			const built = await webpage.build();
			await Utils.delay(0);
			if (built) await this.index.addFile(webpage);
			else await this.index.removeFile(webpage);

			// only render the updated and new files
			if (webpage.outputData.hash !== this.index.oldWebsiteData?.webpages[webpage.outputData.fullURL]?.hash) {
				// save the file and then dispose of the webpage
				await webpage.download();
				if (this.exportOptions.autoDisposeWebpages) webpage.dispose();
			}

			await Utils.delay(0);
		}

		try {
			await this.index.finalize();
		} catch (error) {
			ExportLog.error(error, "Problem finalizing index");
		}

		this.validateSite();
		return this;
	}

	private validateSettings() {
		// if iconize plugin is installed, warn if note icons are not enabled
		// @ts-ignore
		if (app.plugins?.enabledPlugins?.has("obsidian-icon-folder")) {
			// @ts-ignore
			const fileToIconName = app.plugins?.plugins?.['obsidian-icon-folder']?.data;
			const noteIconsEnabled = fileToIconName?.settings?.iconsInNotesEnabled ?? false;
			if (!noteIconsEnabled)
			{
				ExportLog.warning("For Iconize plugin support, enable \"Toggle icons while editing notes\" in the Iconize plugin settings.");
			}
		}

		// if excalidraw installed and the embed mode is not set to Native SVG, warn
		// @ts-ignore
		if (app.plugins?.enabledPlugins?.has("obsidian-excalidraw-plugin")) {
			// @ts-ignore
			const embedMode = app.plugins?.plugins?.['obsidian-excalidraw-plugin']?.settings?.['previewImageType'] ?? "";
			if (embedMode != "SVG") {
				ExportLog.warning("For Excalidraw embed support, set the embed mode to \"Native SVG\" in the Excalidraw plugin settings.");
			}
		}

		// the plugin only supports the banner plugin above version 2.0.5
		// @ts-ignore
		if (app.plugins?.enabledPlugins?.has("obsidian-banners")) {
			// @ts-ignore
			const bannerPlugin = app.plugins?.plugins?.['obsidian-banners'];
			let version = bannerPlugin?.manifest?.version ?? "0.0.0";
			version = version?.substring(0, 5);
			if (version < "2.0.5") {
				ExportLog.warning("The Banner plugin version 2.0.5 or higher is required for full support. You have version " + version + ".");
			}
		}
	}

	/**
	 * Run some checks to make sure certain formatting and element rules are followed everywhere.
	 */
	private validateSite() {
		// check for .feature-title elements not inside a .feature-header
		this.index.webpages.forEach(async (webpage: Webpage) => {
			const titles = webpage.pageDocument?.querySelectorAll(".feature-title");
			if (!titles) return;
			titles.forEach(async (title: HTMLElement) => {
				if (!title.closest(".feature-header")) {
					ExportLog.warning(title, `Feature title not inside a feature header in ${webpage.source.path}`);
				}
			});
			await Utils.delay(0);
		});
	}

	public getTargetPathForFile(file: TFile, filename?: string): Path {
		const targetPath = new Path(file.path);
		if (filename) targetPath.fullName = filename;
		targetPath.setWorkingDirectory((this.destination ?? Path.vaultPath.joinString("Web Export")).path);
		targetPath.slugify(this.exportOptions.slugifyPaths);
		return targetPath;
	}

	public async createAttachmentFromSrc(src: string, sourceFile: TFile): Promise<Attachment | undefined> {
		const attachedFile = this.getFilePathFromSrc(src, sourceFile.path);
		if (attachedFile.isDirectory) return;

		const file = app.vault.getFileByPath(attachedFile.pathname);
		let path = file?.path ?? "";
		if (!file) path = AssetHandler.mediaPath.joinString(attachedFile.fullName).path;
		const data: Buffer | undefined = await attachedFile.readAsBuffer();

		if (!data) return;

		const target = new Path(path, this.destination.path)
							.slugify(this.exportOptions.slugifyPaths);

		const attachment = new Attachment(data, target, file, this.exportOptions);
		if (!attachment.sourcePath) attachment.sourcePath = attachedFile.pathname;
		return attachment;
	}

	public getFilePathFromSrc(src: string, exportingFilePath: string): Path {
		// @ts-ignore
		let pathString = "";
		if (src.startsWith("app://")) {
			let fail = false;
			try {
				// @ts-ignore
				pathString = app.vault.resolveFileUrl(src)?.path ?? "";
				if (pathString == "") fail = true;
			} catch {
				fail = true;
			}

			if(fail) {
				pathString = src.replaceAll("app://", "").replaceAll("\\", "/");
				pathString = pathString.replaceAll(pathString.split("/")[0] + "/", "");
				pathString = Path.getRelativePathFromVault(new Path(pathString), true).path;
				ExportLog.log(pathString, "Fallback path parsing:");
			}
		} else {
			const split = src.split("#");

			const hash = split[1]?.trim();
			const path = split[0];
			pathString = app.metadataCache.getFirstLinkpathDest(path, exportingFilePath)?.path ?? "";
			if (hash) {
				pathString += "#" + hash;
			}
		}

		pathString = pathString ?? "";

		return new Path(pathString);
	}
}

import { Bounds, delay, getLengthInPixels, waitUntil } from "./utils";
import { WebpageDocument as ObsidianDocument } from "./document";
import {
	FileData,
	WebpageData,
	WebsiteData,
} from "src/shared/website-data";
import { Notice } from "./notifications";
import { Theme } from "./theme";
import { LinkHandler } from "./links";
import { Shared } from "src/shared/shared";

export class ObsidianWebsite {
	public LinkHandler: LinkHandler = LinkHandler;

	public bodyEl: HTMLElement;
	public centerContentEl: HTMLElement;
	public loadingEl: HTMLElement;

	public isLoaded: boolean = false;
	public isHttp: boolean = window.location.protocol != "file:";
	public metadata: WebsiteData;
	public document: ObsidianDocument;
	public theme: Theme;

	public entryPage: string;

	private onloadCallbacks: ((document: ObsidianDocument) => void)[] = [];
	public onDocumentLoad(callback: (document: ObsidianDocument) => void) {
		this.onloadCallbacks.push(callback);
	}

	public async init() {
		window.addEventListener("load", () => ObsidianSite.onInit());

		if (this.isHttp) {
			this.metadata = (await this.loadWebsiteData()) as WebsiteData;
			if (!this.metadata) {
				console.error("Failed to load website data.");
				return;
			}
		}
	}

	private async onInit() {
		if (!this.isHttp) {
			this.metadata = (await this.loadWebsiteData()) as WebsiteData;
			if (!this.metadata) {
				console.error("Failed to load website data.");
				this.metadata = new WebsiteData();
				this.metadata.ignoreMetadata = true;
			}
		}

		await waitUntil(() => this.metadata != undefined, 16);

		console.log("Website init");
		if (window.location.protocol != "file:") {
			// @ts-expect-error defined in deferred.js
			await loadIncludes();
		}

		this.theme = new Theme();

		this.bodyEl = document.body;
		this.centerContentEl = document.querySelector(
			"#center-content"
		) as HTMLElement;

		this.bodyEl.className += " " + this.metadata.bodyClasses;

		this.createLoadingEl();

		const pathname =
			document
				.querySelector("meta[name='pathname']")
				?.getAttribute("content") ?? "unknown";
		this.entryPage = pathname;

		this.document = await new ObsidianDocument(pathname);
		await this.document.loadChildDocuments();
		await this.document.postLoadInit();

		this.initEvents();

		// Set initial history state
		if (this.isHttp) {
			let initialPath = this.document.pathname;
			if (initialPath == "index.html") initialPath = "";
			history.replaceState(
				{ pathname: initialPath },
				this.document.title,
				initialPath
			);
		}

		this.isLoaded = true;
		this.onloadCallbacks.forEach((cb) => cb(this.document));
	}

	private initEvents() {
		window.addEventListener("popstate", async (e) => {
			console.log("popstate", e);
			if (!e.state) return;
			const pathname = e.state.pathname;
			await ObsidianSite.loadURL(pathname, false);
		});

		const localThis = this;
		window.addEventListener("resize", () => {
			localThis.onResize();
		});
		this.onResize();
	}

	public updateMetaTag(name: string, content: string) {
		let meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
		if (!meta) {
			meta = document.createElement('meta');
			if (name.startsWith('og:')) {
				meta.setAttribute('property', name);
			} else {
				meta.setAttribute('name', name);
			}
			document.head.appendChild(meta);
		}
		meta.setAttribute('content', content);
	}

	public async loadURL(url: string, pushState: boolean = true): Promise<ObsidianDocument | undefined> {
		const header = LinkHandler.getHashFromURL(url);
		const query = LinkHandler.getQueryFromURL(url);
		url = LinkHandler.getPathnameFromURL(url);
		console.log("Loading URL", url, header, query);

		// if this document is already loaded
		if (this.document.pathname == url) {
			if (header) this.document.scrollToHeader(header);
			else {
				new Notice("This page is already loaded.");
			}

			return this.document;
		}

		const data = ObsidianSite.getWebpageData(url) as WebpageData;
		if (!data) {
			new Notice("This page does not exist yet.");
			console.warn("Page does not exist", url);
			return undefined;
		}

		const page = await new ObsidianDocument(url).load();

		if (!page)
		{
			new Notice("Failed to load page. Unknown error.");
			return;
		}

		// Update meta tags
		document.title = page.title;
		this.updateMetaTag("pathname", page.pathname);
		this.updateMetaTag("description", page.info?.description || "");
		this.updateMetaTag("author", page.info?.author || "");
		this.updateMetaTag("og:title", page.title);
		this.updateMetaTag("og:description", page.info?.description || "");
		this.updateMetaTag("og:url", window.location.href);
		this.updateMetaTag("og:image", page.info?.coverImageURL || "");

		this.document = page;

		if (this.document && this.isHttp && pushState) {
			let currentPath = this.document.pathname;
			if (currentPath == "index.html") currentPath = "";
			history.pushState(
				{ pathname: currentPath },
				this.document.title,
				currentPath
			);
		}

		setTimeout(async () => {

			this.onloadCallbacks.forEach((cb) => cb(page));

			await page.show();

			if (header) {
				page.scrollToHeader(header);
			}
		}, 100); // Small delay to ensure the DOM is updated

		return page;
	}

	public async fetch(url: string): Promise<Response | undefined> {
		url = LinkHandler.getPathnameFromURL(url);

		if (this.isHttp || url.startsWith("http")) {
			const req = await fetch(url);
			if (req.ok) {
				return req;
			} else {
				console.error("Failed to fetch", url);
				return;
			}
		} else {
			const file = this.getFileData(url);
			if (!file?.data) {
				console.error("Failed to fetch", url);
				return;
			}

			const req = new Response(file.data, { status: 200 });
			return req;
		}
	}

	public documentExists(url: string): boolean {
		url = LinkHandler.getPathnameFromURL(url);
		if (this.isHttp) {
			return !!this.metadata.webpages[url];
		} else {
			return !!this.getFileData(url)?.data;
		}
	}

	private async loadWebsiteData(): Promise<WebsiteData | undefined> {
		if (this.isHttp) {
			try {
				const dataReq = await fetch(
					Shared.libFolderName + "/metadata.json"
				);
				if (dataReq.ok) {
					const jsonStr = await dataReq.text();
					return WebsiteData.fromJSON(jsonStr);
				}
			} catch (e) {
				console.error("Failed to load website metadata.", e);
				new Notice("Failed to load website metadata.");
			}
		} else {
			const jsonData = this.getLocalDataFromId("website-metadata");
			return jsonData
				? WebsiteData.fromJSON(JSON.stringify(jsonData))
				: undefined;
		}
		return undefined;
	}

	public getLocalDataFromId(id: string): any | undefined {
		const el = document.getElementById(id);
		if (!el) return;
		return JSON.parse(decodeURI(atob(el.getAttribute("value") ?? "")));
	}

	private cachedWebpageDataMap: Map<string, WebpageData> = new Map();
	public getWebpageData(url: string): WebpageData | undefined {
		if (!this.isHttp) {
			if (this.cachedWebpageDataMap.has(url)) {
				return this.cachedWebpageDataMap.get(url) as WebpageData;
			} else {
				const data = this.getLocalDataFromId(
					LinkHandler.getFileDataIdFromURL(url)
				) as WebpageData;
				this.cachedWebpageDataMap.set(url, data);
				return data;
			}
		}

		if (this.metadata) {
			const data = this.metadata.webpages[url];
			if (data) {
				return data;
			}
		}

		return;
	}

	private cachedFileDataMap: Map<string, FileData> = new Map();
	public getFileData(url: string): FileData {
		if (!this.isHttp) {
			if (this.cachedFileDataMap.has(url)) {
				return this.cachedFileDataMap.get(url) as FileData;
			} else {
				const data = this.getLocalDataFromId(
					LinkHandler.getFileDataIdFromURL(url)
				) as FileData;
				this.cachedFileDataMap.set(url, data);
				return data;
			}
		}

		if (this.metadata) {
			const data = this.metadata.fileInfo[url];
			if (data) {
				return data;
			}
		}

		return {} as FileData;
	}

	public scrollTo(element: Element) {
		element.scrollIntoView();
	}

	public async showLoading(
		loading: boolean,
		inside: HTMLElement = this.centerContentEl
	) {
		inside.style.transitionDuration = "";
		inside.classList.toggle("hide", loading);
		this.loadingEl.classList.toggle("show", loading);

		if (loading) {
			// position loading icon in the center of the screen
			const viewBounds = Bounds.fromElement(inside);
			this.loadingEl.style.left =
				viewBounds.center.x - this.loadingEl.offsetWidth / 2 + "px";
			this.loadingEl.style.top =
				viewBounds.center.y - this.loadingEl.offsetHeight / 2 + "px";
		}

		await delay(200);
	}

	private createLoadingEl() {
		this.loadingEl = document.createElement("div");
		this.loadingEl.classList.add("loading-icon");
		document.body.appendChild(this.loadingEl);
		this.loadingEl.innerHTML = `<div></div><div></div><div></div><div></div>`;
	}

	public get documentBounds(): Bounds {
		return Bounds.fromElement(this.centerContentEl);
	}

	private onEndResize() {
		document.body.classList.toggle("resizing", false);
	}

	private onStartResize() {
		document.body.classList.toggle("resizing", true);
	}

	private lastScreenWidth: number | undefined = undefined;
	private isResizing = false;
	private checkStillResizingTimeout: NodeJS.Timeout | undefined = undefined;
	private _deviceSize: string = "large-screen";
	public get deviceSize(): string {
		return this._deviceSize;
	}

	private set deviceSize(size: string) {
		this._deviceSize = size;
	}

	private onResize() {
		if (!this.isResizing) {
			this.onStartResize();
			this.isResizing = true;
		}

		const localThis = this;

		function widthNowInRange(low: number, high: number) {
			const w = window.innerWidth;
			return (
				(w > low &&
					w < high &&
					localThis.lastScreenWidth == undefined) ||
				(w > low &&
					w < high &&
					((localThis.lastScreenWidth ?? 0) <= low ||
						(localThis.lastScreenWidth ?? 0) >= high))
			);
		}

		function widthNowGreaterThan(value: number) {
			const w = window.innerWidth;
			return (
				(w > value && localThis.lastScreenWidth == undefined) ||
				(w > value && (localThis.lastScreenWidth ?? 0) < value)
			);
		}

		function widthNowLessThan(value: number) {
			const w = window.innerWidth;
			return (
				(w < value && localThis.lastScreenWidth == undefined) ||
				(w < value && (localThis.lastScreenWidth ?? 0) > value)
			);
		}

		const docWidthCSS = this.metadata.documentWidth;

		// calculate the css widths
		const docWidth = getLengthInPixels(docWidthCSS, this.centerContentEl);

		if (
			widthNowGreaterThan(docWidth) ||
			widthNowGreaterThan(1025)
		) {
			this.deviceSize = "large-screen";
			document.body.classList.toggle("is-large-screen", true);
			document.body.classList.toggle("is-small-screen", false);
			document.body.classList.toggle("is-tablet", false);
			document.body.classList.toggle("is-phone", false);
		} else if (
			widthNowInRange(769, 1024)
		) {
			this.deviceSize = "small screen";
			document.body.classList.toggle("is-large-screen", false);
			document.body.classList.toggle("is-small-screen", true);
			document.body.classList.toggle("is-tablet", false);
			document.body.classList.toggle("is-phone", false);
		} else if (
			widthNowInRange(481, 768)
		) {
			this.deviceSize = "tablet";
			document.body.classList.toggle("is-large-screen", false);
			document.body.classList.toggle("is-small-screen", false);
			document.body.classList.toggle("is-tablet", true);
			document.body.classList.toggle("is-phone", false);
		} else if (
			widthNowLessThan(480)
		) {
			this.deviceSize = "phone";
			document.body.classList.toggle("is-large-screen", false);
			document.body.classList.toggle("is-small-screen", false);
			document.body.classList.toggle("is-tablet", false);
			document.body.classList.toggle("is-phone", true);
		}

		this.lastScreenWidth = window.innerWidth;

		if (this.checkStillResizingTimeout != undefined)
			clearTimeout(this.checkStillResizingTimeout);

		// wait a little bit of time and if the width is still the same then we are done resizing
		const screenWidthSnapshot = window.innerWidth;
		this.checkStillResizingTimeout = setTimeout(function () {
			if (window.innerWidth == screenWidthSnapshot) {
				localThis.checkStillResizingTimeout = undefined;
				localThis.isResizing = false;
				localThis.onEndResize();
			}
		}, 200);
	}
}

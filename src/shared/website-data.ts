import { CustomHeadOptions } from "./features/custom-head";

export enum EmojiStyle {
	Native = "Native",
	Twemoji = "Twemoji",
	OpenMoji = "OpenMoji",
	OpenMojiOutline = "OpenMojiOutline",
	FluentUI = "FluentUI",
}

export enum DocumentType {
	Markdown = "markdown",
	Attachment = "attachment",
	Other = "other"
}

export interface FileData {
	createdTime: number;
	modifiedTime: number;
	sourceSize: number;
	sourcePath: string;
	exportPath: string;
	backlinks: string[];
	type: string;
	data: string | null;
	hash: string;
}

export interface WebpageData extends FileData {
	headers: {heading: string, level: number, id: string}[];
	aliases: string[];
	inlineTags: string[];
	frontmatterTags: string[];
	links: string[];
	attachments: string[];

	title: string;
	pathToRoot: string;
	icon: string;
	description: string;
	author: string;
	coverImageURL: string;
	fullURL: string;
}

export class WebsiteOptions {
	/**
	 * Custom head content options
	 */
	customHead: CustomHeadOptions;

	/**
	 * Document section options
	 */
	documentWidth: string;

	public static fromJSON(json: string): WebsiteOptions {
		const data = Object.assign(new WebsiteOptions(), JSON.parse(json));
		data.customHead = Object.assign(new CustomHeadOptions(), data.customHead);
		return data;
	}
}

export class WebsiteData {
	ignoreMetadata: boolean = false;
	webpages: {[targetPath: string]: WebpageData} = {};
	fileInfo: {[targetPath: string]: FileData} = {};
	sourceToTarget: {[sourcePath: string]: string} = {};
	attachments: string[] = [];
	allFiles: string[] = [];

	siteName: string = "";
	vaultName: string = "";
	createdTime: number = 0;
	modifiedTime: number = 0;
	pluginVersion: string = "";
	exportRoot: string = "";
	baseURL: string = "";

	themeName: string = "";
	bodyClasses: string = "";
	hasFavicon: boolean = false;
	featureOptions: WebsiteOptions = new WebsiteOptions();

	public static fromJSON(json: string): WebsiteData {
		const data = Object.assign(new WebsiteData(), JSON.parse(json));
		data.featureOptions = WebsiteOptions.fromJSON(JSON.stringify(data.featureOptions));
		return data;
	}
}

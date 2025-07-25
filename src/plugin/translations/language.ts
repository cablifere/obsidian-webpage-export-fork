import { language as cn } from './zh-cn';
import { language as en } from './en';
import { language as it } from './it';
import { language as uk } from './uk';
import { language as pt } from './pt';

export interface i18n {
	cancel: string;
	browse: string;
	pathInputPlaceholder: string;
	pathValidations: {
		noEmpty: string;
		mustExist: string;
		noTilde: string;
		noAbsolute: string;
		noRelative: string;
		noFiles: string;
		noFolders: string;
		mustHaveExtension: string;
	};
	updateAvailable: string;
	exportAsHTML: string;
	settings: {
		title: string;
		support: string;
		debug: string;
		baseFeatures: {
			info_selector: string;
			info_type: string;
			info_displayTitle: string;
			info_featurePlacement: string;
		};
		documentWidth: {
			title: string;
			description: string;
		};
		customHeadSourcePath: {
			title: string;
			description: string;
		};
		styleOptionsSection: {
			title: string;
			description: string;
		};
		makeOfflineCompatible: {
			title: string;
			description: string;
		};
		addHeadTag: {
			title: string;
			description: string;
		};
		addBodyClasses: {
			title: string;
			description: string;
		};
		addMathjaxStyles: {
			title: string;
			description: string;
		};
		flattenExportPaths: {
			title: string;
			description: string;
		};
		includeJs: {
			title: string;
			description: string;
		};
		includeCss: {
			title: string;
			description: string;
		};
		inlineMedia: {
			title: string;
			description: string;
		};
		inlineJs: {
			title: string;
			description: string
		};
		inlineCss: {
			title: string;
			description: string
		};
		inlineFonts: {
			title: string;
			description: string
		};
		inlineOther: {
			title: string;
			description: string
		};
		includePluginCSS: {
			title: string;
			description: string;
		};
		includeStyleCssIds:{
			title: string;
			description: string;
		};
		generalSettingsSection: {
			title: string;
			description: string;
		};
		favicon: {
			title: string;
			description: string;
		};
		siteName: {
			title: string;
			description: string;
		};
		iconEmojiStyle: {
			title: string;
			description: string;
		};
		themeName: {
			title: string;
			description: string;
		};
		relativeHeaderLinks: {
			title: string;
			description: string;
		};
		slugifyPaths: {
			title: string;
			description: string;
		};
		addPageIcon: {
			title: string;
			description: string;
		};
		unifyTitleFormat: {
			title: string;
			description: string;
		};
		logLevel: {
			title: string;
			description: string;
		};
		titleProperty: {
			title: string;
			description: string;
		};
		exportPath: {
			title: string;
			description: string;
		};
		exportBlacklist: {
			title: string;
			description: string;
		}
	}
}

function getUserLanguage(): string {
	return window.moment.locale() || "en";
}

function getLanguage() {
	const settingLanguages = getUserLanguage();
	const language = translations[settingLanguages];
	if (!language) {
		console.log(`Language ${settingLanguages} not found, defaulting to English`);
		return translations["en"];
	}
	return language;
}

export let translations: { [key: string]: i18n } = {
	"en": en, // English
	"zh-cn": cn, // Chinese
	"it": it, // Italian
	"uk": uk, // Ukrainian
	"pt": pt, // Brazilian Portuguese
};

export let i18n: i18n = getLanguage();

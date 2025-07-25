import { Notice, Plugin, PluginSettingTab, Setting, getIcon } from 'obsidian';
import { Path } from 'src/plugin/utils/path';
import pluginStylesBlacklist from 'src/assets/third-party-styles-blacklist.txt';
import { ExportLog } from 'src/plugin/render-api/render-api';
import { createDivider, createDropdown, createFileInput, createText, createToggle }  from './settings-components';
import { ExportPipelineOptions } from "src/plugin/website/pipeline-options.js";
import { FlowList } from 'src/plugin/features/flow-list';
import { i18n } from '../translations/language';
import { EmojiStyle } from 'src/shared/website-data';
import supportedStyleIds from "src/assets/plugin-style-ids.json";
import safeParser from 'postcss-safe-parser';

// #region Settings Definition

export enum LogLevel {
	All = "all",
	Warning = "warning",
	Error = "error",
	Fatal = "fatal",
	None = "none",
}

export class Settings {
	public static settingsVersion: string = "0.0.0";

	public static exportOptions: ExportPipelineOptions = new ExportPipelineOptions();

	public static logLevel: LogLevel = LogLevel.Warning;
	public static titleProperty: string = "title";
	public static openAfterExport: boolean = false;

	public static async onlinePreset() {
		Settings.exportOptions.inlineCSS = false;
		Settings.exportOptions.inlineFonts = false;
		Settings.exportOptions.inlineHTML = false;
		Settings.exportOptions.inlineJS = false;
		Settings.exportOptions.inlineMedia = false;
		Settings.exportOptions.inlineOther = false;
		Settings.exportOptions.slugifyPaths = true;

		await SettingsPage.saveSettings();
	}

	public static async localPreset() {
		Settings.exportOptions.inlineCSS = true;
		Settings.exportOptions.inlineFonts = true;
		Settings.exportOptions.inlineHTML = false;
		Settings.exportOptions.inlineJS = true;
		Settings.exportOptions.inlineMedia = true;
		Settings.exportOptions.inlineOther = true;
		Settings.exportOptions.slugifyPaths = true;

		await SettingsPage.saveSettings();
	}

	public static async rawDocumentsPreset() {
		Settings.exportOptions.inlineCSS = true;
		Settings.exportOptions.inlineFonts = true;
		Settings.exportOptions.inlineHTML = true;
		Settings.exportOptions.inlineJS = true;
		Settings.exportOptions.inlineMedia = true;
		Settings.exportOptions.inlineOther = true;
		Settings.exportOptions.slugifyPaths = false;

		await SettingsPage.saveSettings();
	}
}

// #endregion

export class SettingsPage extends PluginSettingTab {

	display() {
		const { containerEl: container } = this;

		const lang = i18n.settings;

		// #region Settings Header

		container.empty();
		container.classList.add('webpage-html-settings');

		const header = container.createEl('h2', { text: lang.title });
		header.style.display = 'block';
		header.style.marginBottom = '15px';

		const supportContainer = container.createDiv();
		supportContainer.style.marginBottom = '15px';
		const supportLink = container.createEl('a');
		const buttonColor = "3ebba4";
		const buttonTextColor = "ffffff";
		// @ts-ignore
		supportLink.href = `https://www.buymeacoffee.com/nathangeorge`;
		supportLink.style.height = "40px"
		supportLink.innerHTML = `<img style="height:40px;" src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=nathangeorge&button_colour=${buttonColor}&font_colour=${buttonTextColor}&font_family=Poppins&outline_colour=${buttonTextColor}&coffee_colour=FFDD00">`;
		const supportHeader = container.createDiv({ text: lang.support, cls: "setting-item-description" });
		supportHeader.style.display = 'block';

		supportContainer.style.display = 'grid';
		supportContainer.style.gridTemplateColumns = "0.5fr 0.5fr";
		supportContainer.style.gridTemplateRows = "40px 20px";
		supportContainer.appendChild(supportLink);

		// debug info button
		const debugInfoButton = container.createEl('button');
		const bugIcon = getIcon('bug');
		if (bugIcon) debugInfoButton.appendChild(bugIcon);
		debugInfoButton.style.height = '100%';
		debugInfoButton.style.aspectRatio = '1/1';
		debugInfoButton.style.justifySelf = 'end';
		const debugHeader = container.createDiv({ text: lang.debug, cls: "setting-item-description" });
		debugHeader.style.display = 'block';
		debugHeader.style.justifySelf = 'end';
		debugInfoButton.addEventListener('click', () => {
			navigator.clipboard.writeText(ExportLog.getDebugInfo());
			new Notice("Debug info copied to clipboard!");
		});
		supportContainer.appendChild(debugInfoButton);
		supportContainer.appendChild(supportHeader);
		supportContainer.appendChild(debugHeader);

		// #endregion

		const section = container.createEl('div');

		createDivider(section);

		// #region Export Features

		createFileInput(section,
			() => Settings.exportOptions.exportPath,
			(value) => Settings.exportOptions.exportPath = value,
			{
				name: lang.exportPath.title,
				description: lang.exportPath.description,
				placeholder: i18n.pathInputPlaceholder,
				makeRelativeToVault: false,
				pickFolder: true,
				validation: (path) => path.validate(
					{
						allowEmpty: true,
						allowAbsolute: true,
						allowRelative: true,
						allowFiles: false,
						allowDirectories: true,
						requireExists: true,
					}),
				browseButton: true,
			});

		createText(section, lang.exportBlacklist.title,
			() => Settings.exportOptions.exportBlacklist,
			(value) => Settings.exportOptions.exportBlacklist = value,
			lang.exportBlacklist.description);

		createText(section, lang.siteName.title,
			() => Settings.exportOptions.siteName,
			(value) => Settings.exportOptions.siteName = value,
			lang.siteName.description);

		createText(section, lang.titleProperty.title,
			() => Settings.titleProperty,
			(value) => Settings.titleProperty = value,
			lang.titleProperty.description);

		createFileInput(section,
			() => Settings.exportOptions.faviconPath,
			(value) => Settings.exportOptions.faviconPath = value,
			{
				name: lang.favicon.title,
				description: lang.favicon.description,
				placeholder: i18n.pathInputPlaceholder,
				makeRelativeToVault: true,
				pickFolder: false,
				validation: (path) => path.validate({
					allowEmpty: true,
					allowAbsolute: true,
					allowRelative: true,
					allowFiles: true,
					allowDirectories: false,
					requireExists: true,
					requireExtensions: ["png", "ico", "jpg", "jpeg", "svg"]
				}),
				browseButton: true,
			});

		createFileInput(section,
			() => Settings.exportOptions.customHeadSourcePath,
			(value) => Settings.exportOptions.customHeadSourcePath = value,
			{
				name: lang.customHeadSourcePath.title,
				description: lang.customHeadSourcePath.description,
				placeholder: i18n.pathInputPlaceholder,
				makeRelativeToVault: true,
				pickFolder: false,
				validation: (path) => path.validate({
					allowEmpty: true,
					allowAbsolute: true,
					allowRelative: true,
					allowFiles: true,
					allowDirectories: false,
					requireExists: true,
					requireExtensions: ["html"]
				}),
				browseButton: true,
			});

		createToggle(section, lang.slugifyPaths.title,
			() => Settings.exportOptions.slugifyPaths,
			(value) => Settings.exportOptions.slugifyPaths = value,
			lang.slugifyPaths.description);

		createToggle(section, lang.flattenExportPaths.title,
			() => Settings.exportOptions.flattenExportPaths,
			(value) => Settings.exportOptions.flattenExportPaths = value,
			lang.flattenExportPaths.description);

		createToggle(section, lang.makeOfflineCompatible.title,
			() => Settings.exportOptions.offlineResources,
			(value) => Settings.exportOptions.offlineResources = value,
			lang.makeOfflineCompatible.description);

		// #endregion

		createDivider(section);

		// #region Style Settings

		createDropdown(section, lang.themeName.title,
			// @ts-ignore
			() => Settings.exportOptions.themeName || app.vault?.config?.cssTheme || "Default",
			(value) => Settings.exportOptions.themeName = value,
			this.getInstalledThemesRecord(),
			lang.themeName.description);

		createDropdown(section, lang.iconEmojiStyle.title,
			() => Settings.exportOptions.iconEmojiStyle,
			(value) => Settings.exportOptions.iconEmojiStyle = value as EmojiStyle,
			EmojiStyle,
			lang.iconEmojiStyle.description);

		createToggle(section, lang.addPageIcon.title,
			() => Settings.exportOptions.addPageIcon,
			(value) => Settings.exportOptions.addPageIcon = value,
			lang.addPageIcon.description);

		createToggle(section, lang.unifyTitleFormat.title,
			() => Settings.exportOptions.unifyTitleFormat,
			(value) => Settings.exportOptions.unifyTitleFormat = value,
			lang.unifyTitleFormat.description);

		createText(section, lang.documentWidth.title,
			() => Settings.exportOptions.documentWidth,
			(value) => Settings.exportOptions.documentWidth = value,
			lang.documentWidth.description);

		createToggle(section, lang.relativeHeaderLinks.title,
			() => Settings.exportOptions.relativeHeaderLinks,
			(value) => Settings.exportOptions.relativeHeaderLinks = value,
			lang.relativeHeaderLinks.description);

		new Setting(section)
			.setName(lang.includeStyleCssIds.title)
			.setDesc(lang.includeStyleCssIds.description)

		const styleIdsList = new FlowList();
		styleIdsList.generate(section);
		this.getStyleTagIds().forEach(async (plugin) => {
			if (supportedStyleIds.ids.contains(plugin) || supportedStyleIds.ignoreIds.contains(plugin)) return;

			const isChecked = Settings.exportOptions.includeStyleCssIds.contains(plugin);

			styleIdsList.addItem(plugin, plugin, isChecked, (value) => {
				Settings.exportOptions.includeStyleCssIds = styleIdsList.checkedList;
				SettingsPage.saveSettings();
			});
		});

		new Setting(section)
			.setName(lang.includePluginCSS.title)
			.setDesc(lang.includePluginCSS.description)

		const pluginsList = new FlowList();
		pluginsList.generate(section);
		this.getPluginIDs().forEach(async (plugin) => {
			//@ts-ignore
			const pluginManifest = app.plugins.manifests[plugin];
			if (!pluginManifest) return;

			if ((await this.getBlacklistedPluginIDs()).contains(pluginManifest.id)) {
				return;
			}

			const pluginDir = pluginManifest.dir;
			if (!pluginDir) return;
			const pluginPath = new Path(pluginDir);

			const hasCSS = pluginPath.joinString('styles.css').exists;
			if (!hasCSS) return;

			const isChecked = Settings.exportOptions.includePluginCss.contains(plugin);

			pluginsList.addItem(pluginManifest.name, plugin, isChecked, (value) => {
				Settings.exportOptions.includePluginCss = pluginsList.checkedList;
				SettingsPage.saveSettings();
			});
		});

		// #endregion

		createDivider(section);

		// #region Export Settings

		createToggle(section, lang.addHeadTag.title,
			() => Settings.exportOptions.addHeadTag,
			(value) => Settings.exportOptions.addHeadTag = value,
			lang.addHeadTag.description);

		createToggle(section, lang.addBodyClasses.title,
			() => Settings.exportOptions.addBodyClasses,
			(value) => Settings.exportOptions.addBodyClasses = value,
			lang.addBodyClasses.description);

		createToggle(section, lang.includeJs.title,
			() => Settings.exportOptions.includeJS,
			(value) => Settings.exportOptions.includeJS = value,
			lang.includeJs.description);

		createToggle(section, lang.includeCss.title,
			() => Settings.exportOptions.includeCSS,
			(value) => Settings.exportOptions.includeCSS = value,
			lang.includeCss.description);

		createToggle(section, lang.inlineJs.title,
			() => Settings.exportOptions.inlineJS,
			(value) => Settings.exportOptions.inlineJS = value,
			lang.inlineJs.description);

		createToggle(section, lang.inlineCss.title,
			() => Settings.exportOptions.inlineCSS,
			(value) => Settings.exportOptions.inlineCSS = value,
			lang.inlineCss.description);

		createToggle(section, lang.inlineMedia.title,
			() => Settings.exportOptions.inlineMedia,
			(value) => Settings.exportOptions.inlineMedia = value,
			lang.inlineMedia.description);

		createToggle(section, lang.inlineFonts.title,
			() => Settings.exportOptions.inlineFonts,
			(value) => Settings.exportOptions.inlineFonts = value,
			lang.inlineFonts.description);

		createToggle(section, lang.inlineOther.title,
			() => Settings.exportOptions.inlineOther,
			(value) => Settings.exportOptions.inlineOther = value,
			lang.inlineOther.description);

		// #endregion

		createDivider(section);

		// #region Obsidian Settings

		createDropdown(section, lang.logLevel.title,
			() => Settings.logLevel,
			(value) => Settings.logLevel = value as LogLevel,
			LogLevel,
			lang.logLevel.description);

		// #endregion
	}

	// #region Class Functions and Variables
	static plugin: Plugin;
	static loaded = false;

	private blacklistedPluginIDs: string[] = [];
	public async getBlacklistedPluginIDs(): Promise<string[]> {
		if (this.blacklistedPluginIDs.length > 0) return this.blacklistedPluginIDs;
		this.blacklistedPluginIDs = pluginStylesBlacklist.replaceAll("\r", "").split("\n");

		return this.blacklistedPluginIDs;
	}

	constructor(plugin: Plugin) {
		super(app, plugin);
		SettingsPage.plugin = plugin;
	}

	getPluginIDs(): string[] {
		/*@ts-ignore*/
		const pluginsArray: string[] = Array.from(app.plugins.enabledPlugins.values()) as string[];
		for (let i = 0; i < pluginsArray.length; i++) {
			/*@ts-ignore*/
			if (app.plugins.manifests[pluginsArray[i]] === undefined) {
				pluginsArray.splice(i, 1);
				i--;
			}
		}

		return pluginsArray;
	}

	public static nameStylesheet(stylesheet: string): string {
		const words: string[] = [];
		const commentWords: string[] = [];
		const commonWords = new Set([
			'svelte', 'wrapper', 'container', 'item', 'button', 'input', 'text', 'style',
			'color', 'background', 'margin', 'padding', 'width', 'height', 'display', 'position', 'font', "cm", "pcr", "app", "workspace"
		]);

		const root = safeParser(stylesheet);

		// Extract words from top comments
		root.nodes.forEach(node => {
			if (node.type === 'comment') {
				const commentText = node.text.toLowerCase();
				const extractedWords = commentText.match(/\b\w+\b/g) || [];
				commentWords.push(...extractedWords);
			} else {
				// Stop processing after encountering the first non-comment node
				return false;
			}
		});

		// Extract words from selectors
		root.walkRules((rule) => {
			const selectors = rule.selector.match(/[.#][\w-]+/g) || [];
			selectors.forEach(selector => {
				const parts = selector.slice(1).split('-');
				words.push(...parts);
			});
		});

		// Filter and count occurrences
		const wordCounts = words
			.filter(word => word.length > 1 && !commonWords.has(word.toLowerCase()))
			.reduce((acc, word) => {
				acc[word.toLowerCase()] = (acc[word.toLowerCase()] || 0) + 1;
				return acc;
			}, {} as Record<string, number>);

		// Add comment words that appear in styles
		commentWords.forEach(word => {
			if (wordCounts.hasOwnProperty(word)) {
				wordCounts[word] += 1;
			}
		});

		// Sort words by frequency
		const sortedWords = Object.entries(wordCounts)
			.sort((a, b) => b[1] - a[1]);

		if (sortedWords.length === 0) {
			return "generic-stylesheet";
		}

		if (sortedWords.length > 1 && sortedWords[0][1] === sortedWords[1][1]) {
			return `${sortedWords[0][0]}-${sortedWords[1][0]}-stylesheet`;
		} else {
			return `${sortedWords[0][0]}-stylesheet`;
		}
	}

	public static nameStyles() {
		// name all stylesheets and add the name as their id
		const stylesheets = document.styleSheets;
		for (let i = 1; i < stylesheets.length; i++) {
			// @ts-ignore
			const styleID = stylesheets[i].ownerNode?.id;

			if (!styleID || styleID === "") {
				// first check if it has any non-standard attributes that can be used to uniquely identify it
                // @ts-ignore
				const attributes = stylesheets[i].ownerNode?.attributes;
				if (attributes) {
					// First try to find most meaningful data attribute
					const priorityPrefixes = ['source-plugin', 'type', 'name', 'source'];
					let foundPriorityAttr = false;

					for (const prefix of priorityPrefixes) {
						const attr = Array.from(attributes).find((a: Attr) => a.name === `data-${prefix}`);
						if (attr) {
							// @ts-ignore
							stylesheets[i].ownerNode.id = `${prefix}-${attr.value}-stylesheet`;
							foundPriorityAttr = true;
							break;
						}
					}

					if (!foundPriorityAttr) {
						// Collect all data attributes
						const dataAttrs = Array.from(attributes)
							.filter((attr: Attr) => attr.name.startsWith('data-'))
							.map((attr: Attr) => ({
								name: attr.name.substring(5),
								value: attr.value
							}));

						if (dataAttrs.length > 0) {
							// Combine all data attributes into ID
							const id = dataAttrs
									.map(attr => `${attr.name}${attr.value ? `-${attr.value}` : ''}`)
									.join('-');
							// @ts-ignore
							stylesheets[i].ownerNode.id = `${id}-stylesheet`;
							continue;
						}
					} else {
						continue;
					}
				}

				// Check for other unique attributes if no data- attributes found
				let hasUniqueAttr = false;
				if (attributes) {
					for (const attr of attributes) {
						if (!["type", "id"].contains(attr.name) && !attr.name.startsWith("data-")) {
							// check if the attribute is unique
							const elements = document.querySelectorAll(`[${attr.name}]`);
							if (elements.length === 1) {
								// @ts-ignore
								stylesheets[i].ownerNode.id = `${attr.name}-stylesheet`;
								hasUniqueAttr = true;
								break;
							}
						}
					}
				}

				if (hasUniqueAttr) continue;

				if (!stylesheets[i].ownerNode?.textContent?.contains("svelte-"))
					continue;

				// @ts-ignore
				stylesheets[i].ownerNode.id = this.nameStylesheet(stylesheets[i].ownerNode.textContent);
			}
		}
	}

	getStyleTagIds(): string[] {
		SettingsPage.nameStyles();
		let ids: string[] = [];
		document.querySelectorAll('style').forEach((style) => {
			if (style.id) ids.push(style.id);
		});
		return ids;
	}

	getInstalledThemesRecord(): Record<string, string> {
		// @ts-ignore
		const themes = Object.values(app.customCss.themes) as { name: string, author: string }[];

		const themeRecord: Record<string, string> = {
			// @ts-ignore
			"Current": "obsidian-current-theme",
			"Default": "Default",
		};

		for (const theme of themes) {
			themeRecord[theme.name] = theme.name;
		}

		return themeRecord;
	}

	static deepAssign(truth: any, source: any) {
		if (!source) return;
		let objects = Object.values(truth);
		let keys = Object.keys(truth);
		for (let i = 0; i < objects.length; i++) {
			let key = keys[i];
			let type = typeof objects[i];
			if (type === "object" && source[key] !== undefined) {
				if (Array.isArray(objects[i])) {
					truth[key] = source[key];
				} else {
					SettingsPage.deepAssign(objects[i], source[key]);
				}
			} else if (source[key] !== undefined) {
				truth[key] = source[key];
			}
		}

		return truth;
	}

	static deepCopy(truth: any): any {
		return JSON.parse(JSON.stringify(truth));
	}

	static deepRemoveStartingWith(truth: any, prefix: string): any {
		const keys = Object.keys(truth);
		for (let i = 0; i < keys.length; i++) {
			if (keys[i].startsWith(prefix)) {
				delete truth[keys[i]];
			}

			let type = typeof truth[keys[i]];
			if (type === "object") {
				SettingsPage.deepRemoveStartingWith(truth[keys[i]], prefix);
			}
		}
		return truth;
	}

	static async loadSettings() {
		const loadedSettings = await SettingsPage.plugin.loadData();
		// do a deep object assign so any non exisant values anywhere in the default settings are preserved
		SettingsPage.deepAssign(Settings, loadedSettings);
		// Reconstruct feature option instances to preserve constructor-set properties
		SettingsPage.saveSettings();
		SettingsPage.loaded = true;
	}

	static async saveSettings() {
		let copy = SettingsPage.deepCopy({...Settings});
		copy = SettingsPage.deepRemoveStartingWith(copy, "info_");
		await SettingsPage.plugin.saveData(copy);
	}

	// #endregion
}

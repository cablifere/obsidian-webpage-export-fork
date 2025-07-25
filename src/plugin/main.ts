// imports from obsidian API
import { Plugin } from 'obsidian';

// modules that are part of the plugin
import { AssetHandler } from 'src/plugin/asset-loaders/asset-handler';
import { Settings, SettingsPage } from 'src/plugin/settings/settings';
import { HTMLExporter } from 'src/plugin/exporter';
import { Path } from 'src/plugin/utils/path';
import { _MarkdownRendererInternal, ExportLog, MarkdownRendererAPI } from 'src/plugin/render-api/render-api';
import { DataviewRenderer } from './render-api/dataview-renderer';
import { Website } from './website/website';
import { i18n } from './translations/language';

export default class HTMLExportPlugin extends Plugin {
	static updateInfo: {
		updateAvailable: boolean;
		latestVersion: string;
		currentVersion: string;
		updateNote: string;
	} = {
		updateAvailable: false,
		latestVersion: "0",
		currentVersion: "0",
		updateNote: "",
	};
	static pluginVersion: string = "0.0.0";
	public api = MarkdownRendererAPI;
	public internalAPI = _MarkdownRendererInternal;
	public settings = Settings;
	public assetHandler = AssetHandler;
	public Path = Path;
	public dv = DataviewRenderer;
	public Website = Website;

	async onload() {
		console.log("Loading webpage-html-export plugin");
		HTMLExportPlugin.pluginVersion = this.manifest.version;

		// @ts-ignore
		window.WebpageHTMLExport = this;

		this.addSettingTab(new SettingsPage(this));
		await SettingsPage.loadSettings();
		await AssetHandler.initialize();

		this.addCommand({
			id: "export-html-vault",
			name: "Export vault",
			callback: () => {
				HTMLExporter.export(this.app.vault.getMarkdownFiles());
			},
		});
	}

	onunload() {
		ExportLog.log("unloading webpage-html-export plugin");
	}
}

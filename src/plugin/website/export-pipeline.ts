import { TFile } from "obsidian";
import { Attachment } from "src/plugin/utils/downloadable";
import { AssetLoader } from "src/plugin/asset-loaders/base-asset";
import { ExportPipelineOptions } from "./pipeline-options";

export class WebsiteExportPipeline {
	public files: TFile[];
	public assets: AssetLoader[] = [];
	public attachments: Attachment[] = [];
	public options: ExportPipelineOptions = new ExportPipelineOptions();

	public static createDefault(options: ExportPipelineOptions): WebsiteExportPipeline {
		const pipeline = new WebsiteExportPipeline();
		pipeline.options = options;
		pipeline.files = app.vault.getFiles();
		pipeline.assets = [];
		pipeline.attachments = [];

		return pipeline;
	}
}

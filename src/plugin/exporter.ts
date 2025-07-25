import { Notice, TFile } from "obsidian";
import { Path } from "src/plugin/utils/path";
import { Settings } from "src/plugin/settings/settings";
import { Utils } from "src/plugin/utils/utils";
import { Website } from "src/plugin/website/website";
import { ExportLog, MarkdownRendererAPI } from "src/plugin/render-api/render-api";

export class HTMLExporter {

	public static async export(files: TFile[]) {
		const exportPath = new Path(Settings.exportOptions.exportPath).absoluted();
		const blacklist = Settings.exportOptions.exportBlacklist.split(",").map(s => s.trim());

		let filesToExport = files;
		if (blacklist.length > 0) {
			filesToExport = filesToExport.filter(f => !blacklist.some(b => f.path.includes(b)));
		}

		const website = await HTMLExporter.exportFiles(filesToExport, exportPath, true);

		if (!website) return;
		if (Settings.openAfterExport) Utils.openPath(exportPath);
		new Notice("✅ Finished HTML Export:\n\n" + exportPath, 5000);
	}

	public static async exportFiles(files: TFile[], destination: Path, deleteOld: boolean) : Promise<Website | undefined> {
		MarkdownRendererAPI.beginBatch();
		let website = undefined;
		try {
			website = await (await new Website(destination).load(files)).build();

			if (!website) {
				new Notice("❌ Export Cancelled", 5000);
				return;
			}

			if (deleteOld) {
				ExportLog.addToProgressCap(website.index.deletedFiles.length / 2);
				for (const dFile of website.index.deletedFiles) {
					const path = new Path(dFile, destination.path);

					// don't delete font files
					// this is a hacky way to prevent it from deleting the matjax and other font files used in only certain files
					if (path.extension == "woff" || path.extension == "woff2" || path.extension == "ttf" || path.extension == "otf") {
						ExportLog.progress(0.5, "Deleting Old Files", "Skipping: " + path.path, "var(--color-yellow)");
						continue;
					}

					await path.delete();
					ExportLog.progress(0.5, "Deleting Old Files", "Deleting: " + path.path, "var(--color-red)");
					ExportLog.log(`Deleted file: ${path.path}`);
				};

				await Path.removeEmptyDirectories(destination.path);
			}

			// update metadata.json
			await Utils.downloadAttachments([website.index.websiteDataAttachment()]);
		}
		catch (e) {
			new Notice("❌ Export Failed: " + e, 5000);
			ExportLog.error(e, "Export Failed", true);
		}

		MarkdownRendererAPI.endBatch();

		return website;
	}
}

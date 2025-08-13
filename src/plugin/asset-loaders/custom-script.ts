import ObsidianApp from "src/shared/app";
import { Path } from "src/plugin/utils/path";
import { ExportLog } from "src/plugin/render-api/render-api";

import { AssetLoader } from "./base-asset";
import { AssetType, InlinePolicy, LoadMethod, Mutability } from "./asset-types";

export class CustomScript extends AssetLoader {
  constructor() {
    super("custom-script.js", "", null, AssetType.Script, InlinePolicy.AutoHead, true, Mutability.Dynamic, LoadMethod.Async, 100000000000);
  }

  override async load() {
    const customScriptPath = new Path(this.exportOptions.customScriptPath);

    if (customScriptPath.isEmpty) {
      this.data = "";
      return;
    }

    const validation = customScriptPath.validate({
      allowEmpty: false,
      allowFiles: true,
      allowAbsolute: true,
      allowRelative: true,
      requireExists: true,
    });

    if (!validation.valid) {
      this.data = "";
      ExportLog.error(validation.error + customScriptPath.path);
      return;
    }

    this.source = ObsidianApp.app.vault.getFileByPath(customScriptPath.path);
    if (!this.source) {
      const stat = customScriptPath.stat;
      if (stat) {
        this.sourceStat = { ctime: stat.ctimeMs, mtime: stat.mtimeMs, size: stat.size };
      }
    }

    this.data = await customScriptPath.readAsString() ?? "";
    await super.load();
  }
}

import { Settings, SettingsPage } from "src/plugin/settings/settings";
import { ExportLog } from "src/plugin/render-api/render-api";
import pluginIds from "src/assets/plugin-style-ids.json";

import { AssetLoader } from "./base-asset";
import { AssetType, InlinePolicy, LoadMethod, Mutability } from "./asset-types";
import { OtherPluginStyles } from "./other-plugin-styles";

export class SupportedPluginStyles extends AssetLoader {
  constructor() {
    super("supported-plugins.css", "", null, AssetType.Style, InlinePolicy.AutoHead, true, Mutability.Dynamic, LoadMethod.Async, 5);
  }

  override async load() {
    SettingsPage.nameStyles();
    const stylesheets = document.styleSheets;
    this.data = "";

    for (let i = 1; i < stylesheets.length; i++) {
      // @ts-ignore
      const styleID = stylesheets[i].ownerNode?.id;

      if (pluginIds.ids.contains(styleID) || Settings.exportOptions.includeStyleCssIds.contains(styleID)) {
        ExportLog.log(`Including stylesheet: ${styleID}`);
        const style = stylesheets[i].cssRules;

        for (const item in style) {
          if (style[item].cssText != undefined) {
            this.data += "\n" + style[item].cssText;
          }
        }
      }

      this.data += "\n\n /* ---- */\n\n";
    }

    // iconize
    this.data += await OtherPluginStyles.getStyleForPlugin("obsidian-icon-folder");

    await super.load();
  }
}

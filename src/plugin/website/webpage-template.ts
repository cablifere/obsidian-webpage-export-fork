import { InsertedFeatureOptions } from "src/shared/features/feature-options-base";
import { ExportLog } from "src/plugin/render-api/render-api";
import { AssetHandler } from "src/plugin/asset-loaders/asset-handler";
import { AssetType } from "src/plugin/asset-loaders/asset-types";
import { Utils } from "src/plugin/utils/utils";

import { ExportPipelineOptions } from "./pipeline-options";

export class WebpageTemplate {
  private doc: Document;
  private options: ExportPipelineOptions;

  constructor(options: ExportPipelineOptions) {
    this.options = options;
  }

  public async loadLayout(): Promise<void> {
    this.doc = document.implementation.createHTMLDocument();

    const head = this.doc.head;
    head.innerHTML = `<meta charset="UTF-8">` + head.innerHTML;
    head.innerHTML += `<meta property="og:site_name" content="${this.options.siteName}">`;
    head.innerHTML += `<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, minimum-scale=1.0, maximum-scale=5.0">`;

    head.innerHTML += AssetHandler.getHeadReferences(this.options);

    const body = this.doc.body;
    if (this.options.addBodyClasses) {
      body.setAttribute("class", await WebpageTemplate.getValidBodyClasses() ?? "");
    }

    const main = body.createDiv({ attr: { id: "main" }});
    main.createDiv({ attr: { id: "center-content" }});
  }

  public insertFeature(feature: HTMLElement, featureOptions: InsertedFeatureOptions): void {
    const existingFeature = this.doc.body.querySelector("#" + featureOptions.featureId);
    if (existingFeature) {
      console.warn(`Feature with id ${featureOptions.featureId} already exists in the layout. Removing the existing feature.`);
      existingFeature.remove();
    }
    featureOptions.insertFeature(this.doc.documentElement, feature);
  }

  public insertFeatureString(feature: string, featureOptions: InsertedFeatureOptions): void {
    const div = this.doc.createElement("div");
    div.classList.add("parsed-feature-container");
    div.style.display = "contents";
    div.innerHTML = feature;
    this.insertFeature(div as HTMLElement, featureOptions);
  }

  public getDocElementInner(): string {
    return this.doc.documentElement.innerHTML;
  }

  private static readonly ignoreClasses = [ "publish", "css-settings-manager", "theme-light", "theme-dark" ];
  public static async getValidBodyClasses(): Promise<string> {
    const bodyClasses = Array.from(document.body.classList);

    let validClasses = "";
    validClasses += " publish ";
    validClasses += " css-settings-manager ";

    // keep body classes that are referenced in the styles
    const styles = AssetHandler.getAssetsOfType(AssetType.Style);
    let classes: string[] = [];

    for (const style of styles) {
      ExportLog.progress(0, "Compiling css classes", "Scanning: " + style.filename, "var(--color-yellow)");
      if (typeof (style.data) != "string") {
        continue;
      }

      // this matches every class name with the dot
      const matches = Array.from(style.data.matchAll(/\.([A-Za-z_-]+[\w-]+)/g));
      let styleClasses = matches.map(match => match[0].substring(1).trim());
      // remove duplicates
      styleClasses = styleClasses.filter((value, index, self) => self.indexOf(value) === index);
      classes = classes.concat(styleClasses);

      await Utils.delay(0);
    }

    // remove duplicates
    ExportLog.progress(0, "Filtering classes", "...", "var(--color-yellow)");
    classes = classes.filter((value, index, self) => self.indexOf(value) === index);
    ExportLog.progress(0, "Sorting classes", "...", "var(--color-yellow)");
    classes = classes.sort();

    for (const bodyClass of bodyClasses) {
      ExportLog.progress(0, "Collecting valid classes", "Scanning: " + bodyClass, "var(--color-yellow)");

      if (classes.includes(bodyClass) && !WebpageTemplate.ignoreClasses.includes(bodyClass)) {
        validClasses += bodyClass + " ";
      }
    }

    ExportLog.progress(0, "Cleanup classes", "...", "var(--color-yellow)");
    let result = validClasses.replace(/\s\s+/g, " ");

    // convert to array and remove duplicates
    ExportLog.progress(0, "Filter duplicate classes", result.length + " classes", "var(--color-yellow)");
    result = result.split(" ").filter((value, index, self) => self.indexOf(value) === index).join(" ").trim();

    ExportLog.progress(0, "Classes done", "...", "var(--color-yellow)");

    return result ?? "";
  }
}

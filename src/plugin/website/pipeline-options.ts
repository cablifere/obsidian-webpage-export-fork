import { EmojiStyle } from "src/shared/website-data";
import { MarkdownRendererOptions } from "src/plugin/render-api/api-options";
import ObsidianApp from "src/shared/app";

export class ExportPipelineOptions extends MarkdownRendererOptions {
  // Features that can be toggled on or off

  /**
   * Transfer body classes from obsidian to the exported document.
   */
  addBodyClasses: boolean = true;

  /**
   * Add mathjax styles to the document
   */
  addMathjaxStyles: boolean = true;

  /**
   * Add a <head> tag with metadata, scripts, and styles.
   */
  addHeadTag: boolean = true;

  // Options for the features

  /**
   * Custom head source path
   */
  customHeadSourcePath: string = "";

  /**
   * Document section options
   */
  documentWidth: string = "40em";

  /**
   * Make outline links relative instead of absolute.
   * This will break the ability to copy the header links from the outline
   * But allows you to move the file and still have the links work.
   */
  relativeHeaderLinks: boolean = false;

  /**
   * Include javascript in the export (both inline or external)
   */
  includeJS: boolean = true;

  /**
   * Include CSS in the export (both inline or external)
   */
  includeCSS: boolean = true;

  /**
   * Inline / embed media items (images, video, audio) directly into the HTML.
   */
  inlineMedia: boolean = false;

  /**
   * Inline / embed the css styles directly into the HTML.
   */
  inlineCSS: boolean = false;

  /**
   * Inline / embed the javascript directly into the HTML.
   */
  inlineJS: boolean = false;

  /**
   * Inline / embed fonts directly into the HTML.
   */
  inlineFonts: boolean = false;

  /**
   * Inline / embed other files directly into the HTML.
   */
  inlineOther: boolean = false;

  /**
   * Do not leave any online urls, download them and embed them into the HTML.
   */
  offlineResources: boolean = true;

  /**
   * The name of the theme to use for the export.
   * If the theme does not exist, the default theme will be used.
  */
  themeName: string = "";

  /**
   * Make all paths and file names web style (lowercase, no spaces).
   * For example: "My File.md" -> "my-file.html"
   */
  slugifyPaths: boolean = true;

  /**
   * Flatten all export paths so that all HTML files are exported to the same root directory without the normal folder structure.
   */
  flattenExportPaths: boolean = false;

  /**
   * The local path to the favicon for the site.
   */
  faviconPath: string = "";

  /**
   * The name of the site.
   */
  siteName: string = ObsidianApp.app?.vault?.getName() ?? "";

  /**
   * The property to use as the title of the document
   */
  titleProperty: string = "title";

  /**
   * The style of emoji to use for custom icons.
   */
  iconEmojiStyle: EmojiStyle = EmojiStyle.Native;

  /**
   * Include CSS from the plugins with these ids.
   */
  includePluginCss: string[] = [];

  /**
   * Include CSS from the style elements with these ids.
   */
  includeStyleCssIds: string[] = [];

  /**
   * Auto dispose webpage documents and elements after each one is rendered.
   */
  autoDisposeWebpages: boolean = true;

  /**
   * The path to export the files to.
   */
  exportPath: string = "";

  /**
   * Comma separated list of files and folders to exclude from the export
   */
  exportBlacklist: string = "";

  /**
   * Open the output folder after export
   */
  openAfterExport: boolean = true;
}

import { i18n } from "./language";

export const language: i18n = {
  cancel: "Cancel",
  browse: "Browse",
  pathInputPlaceholder: "Type or browse a path...",
  pathValidations: {
    noEmpty: "Path cannot be empty",
    mustExist: "Path does not exist",
    noTilde: "Home directory with tilde (~) is not allowed",
    noAbsolute: "Path cannot be absolute",
    noRelative: "Path cannot be relative",
    noFiles: "Path cannot be a file",
    noFolders: "Path cannot be a directory",
    mustHaveExtension: "Path must have ext: {0}",
  },
  updateAvailable: "Update Available",
  exportAsHTML: "Export as HTML",
  settings: {
    title: "Basic HTML Export Settings",
    support: "Support the continued development of this plugin.",
    debug: "Copy debug info to clipboard",
    baseFeatures: {
      info_selector: "CSS selector for an element. The feature will be placed relative to this element.",
      info_type: "Will this feature be placed before, after, or inside (at the beggining or end).",
      info_displayTitle: "Descriptive title to show above the feature",
      info_featurePlacement: "Where to place this feature on the page. (Relative to the selector)",
    },
    documentWidth: {
      title: "Document width",
      description: "The width of the document",
    },
    customHeadSourcePath: {
      title: "Custom HTML / JS",
      description: "Insert a given .html file onto the page which can include custom JS or CSS",
    },
    customScriptPath: {
      title: "Custom JS",
      description: "Insert a custom .js file onto the page",
    },
    styleOptionsSection: {
      title: "Style options",
      description: "Configure which styles are included with the export",
    },
    makeOfflineCompatible: {
      title: "Make offline compatible",
      description: "Download any online assets / images / scripts so the page can be viewed offline. Or so the website does not depend on a CDN",
    },
    flattenExportPaths: {
      title: "Flatten export paths",
      description: "Flatten all export paths so that all HTML files are exported to the same root directory without the normal folder structure",
    },
    includeJs: {
      title: "Include JS",
      description: "Include javascript in the export (both inline or external)",
    },
    includeCss: {
      title: "Include CSS",
      description: "Include CSS in the export (both inline or external)",
    },
    inlineMedia: {
      title: "Inline media",
      description: "Inline / embed media items (images, video, audio) directly into the HTML",
    },
    inlineJs: {
      title: "Inline JS",
      description: "Inline / embed the javascript directly into the HTML",
    },
    inlineCss: {
      title: "Inline CSS",
      description: "Inline / embed the CSS styles directly into the HTML",
    },
    inlineFonts: {
      title: "Inline fonts",
      description: "Inline / embed fonts directly into the HTML",
    },
    inlineOther: {
      title: "Inline other",
      description: "Inline / embed other files directly into the HTML",
    },
    includePluginCSS: {
      title: "Include CSS from Plugins",
      description: "Include the CSS from the following plugins in the exported HTML. If plugin features aren't rendering correctly, try adding the plugin to this list. Avoid adding plugins unless you specifically notice a problem, because more CSS will increase the loading time of your page.",
    },
    includeStyleCssIds: {
      title: "Include Styles with IDs",
      description: "Include CSS from style tags with the following IDs in the exported HTML",
    },
    generalSettingsSection: {
      title: "General Settings",
      description: "Control simple settings like the favicon and site metadata",
    },
    favicon: {
      title: "Favicon image",
      description: "The local path to the favicon for the site",
    },
    siteName: {
      title: "Site name",
      description: "The name of the vault / exported site",
    },
    iconEmojiStyle: {
      title: "Icon emoji style",
      description: "The style of emoji to use for custom icons",
    },
    themeName: {
      title: "Theme",
      description: "The installed theme to use for the export",
    },
    addHeadTag: {
      title: "Add head tag",
      description: "Add a <head> tag with metadata, scripts, and styles",
    },
    addBodyClasses: {
      title: "Add body classes",
      description: "Transfer body classes from obsidian to the exported document",
    },
    addMathjaxStyles: {
      title: "Add Mathjax styles",
      description: "Add Mathjax styles to the document",
    },
    relativeHeaderLinks: {
      title: "Relative header links",
      description: "Use relative links for headers instead of absolute links",
    },
    slugifyPaths: {
      title: "Slugify paths",
      description: "Make all paths and file names web style (lowercase, no spaces)",
    },
    addPageIcon: {
      title: "Add page icon",
      description: "Add the file's icon to the page header",
    },
    unifyTitleFormat: {
      title: "Unify title format",
      description: "Modify the title to a unified format",
    },
    logLevel: {
      title: "Log level",
      description: "Set the level of logging to display in the console",
    },
    titleProperty: {
      title: "Title property",
      description: "The property to use as the title of the document",
    },
    exportPath: {
      title: "Exported files location",
      description: "The path to export the site to. If left empty, the export will be saved to the same directory as the vault",
    },
    exportBlacklist: {
      title: "Export blacklist",
      description: "Comma separated list of files and folders to exclude from the export",
    },
    openAfterExport: {
      title: "Open after export",
      description: "Open the output folder after export",
    },
    exportVault: {
      title: "Export vault",
      description: "Export your vault using the current settings",
      button: "Export",
      buttonWorking: "Exporting...",
    },
    copyDebug: {
      title: "Copy debug info",
      description: "Copy plugin debug information to your clipboard",
    },
  },
};

import { i18n } from "./language";

export const language: i18n = {
  cancel: "取消",
  browse: "浏览",
  pathInputPlaceholder: "输入或浏览路径...",
  pathValidations: {
    noEmpty: "路径不能为空",
    mustExist: "路径不存在",
    noTilde: "不允许使用带有波浪号 (~) 的主目录",
    noAbsolute: "路径不能是绝对路径",
    noRelative: "路径不能是相对路径",
    noFiles: "路径不能是文件",
    noFolders: "路径不能是文件夹",
    mustHaveExtension: "路径必须包含扩展名: {0}",
  },
  updateAvailable: "有更新可用",
  exportAsHTML: "导出为HTML",
  settings: {
    title: "HTML导出设置",
    support: "支持该插件的持续开发。",
    debug: "将调试信息复制到剪贴板",
    baseFeatures: {
      info_selector: "用于定位元素的CSS选择器。功能将相对于该元素放置。",
      info_type: "该功能将放置在该元素之前、之后，还是内部（开头或结尾）。",
      info_displayTitle: "功能上方显示的描述性标题",
      info_featurePlacement: "将此功能放置在页面上的位置（相对于选择器）。",
    },
    documentWidth: {
      title: "文档",
      description: "文档的宽度",
    },
    customScriptPath: {
      title: "",
      description: "",
    },
    styleOptionsSection: {
      title: "样式选项",
      description: "配置导出中包含的样式",
    },
    makeOfflineCompatible: {
      title: "使页面离线兼容",
      description: "下载所有在线资源、图像、脚本，使页面可以离线查看，或者使网站不依赖CDN。",
    },
    addHeadTag: {
      title: "",
      description: "",
    },
    addBodyClasses: {
      title: "",
      description: "",
    },
    addMathjaxStyles: {
      title: "",
      description: "",
    },
    flattenExportPaths: {
      title: "",
      description: "",
    },
    includeJs: {
      title: "",
      description: "",
    },
    includeCss: {
      title: "",
      description: "",
    },
    inlineMedia: {
      title: "",
      description: "",
    },
    inlineJs: {
      title: "",
      description: "",
    },
    inlineCss: {
      title: "",
      description: "",
    },
    inlineFonts: {
      title: "",
      description: "",
    },
    inlineOther: {
      title: "",
      description: "",
    },
    includePluginCSS: {
      title: "包含插件的CSS",
      description: "在导出的HTML中包含以下插件的CSS。如果插件功能未正确呈现，请尝试将插件添加到此列表中。避免无必要添加插件，因为更多的CSS会增加页面的加载时间。",
    },
    includeStyleCssIds: {
      title: "包含特定ID的样式",
      description: "在导出的HTML中包含带有以下ID的样式标签的CSS。",
    },
    generalSettingsSection: {
      title: "通用设置",
      description: "控制网站图标和站点元数据等简单设置",
    },
    favicon: {
      title: "网站图标",
      description: "站点的网站图标的本地路径",
    },
    siteName: {
      title: "站点名称",
      description: "库/导出站点的名称",
    },
    iconEmojiStyle: {
      title: "图标表情符号样式",
      description: "用于自定义图标的表情符号样式",
    },
    themeName: {
      title: "主题",
      description: "导出使用的已安装主题",
    },
    relativeHeaderLinks: {
      title: "使用相对标题链接",
      description: "为标题使用相对链接而不是绝对链接",
    },
    slugifyPaths: {
      title: "路径别名化",
      description: "使所有路径和文件名符合网络风格（小写，无空格）",
    },
    addPageIcon: {
      title: "添加页面图标",
      description: "在页面标题中添加文件的图标",
    },
    unifyTitleFormat: {
      title: "",
      description: "",
    },
    logLevel: {
      title: "日志级别",
      description: "设置在控制台中显示的日志级别",
    },
    titleProperty: {
      title: "标题属性",
      description: "用作文档标题的属性",
    },
    exportPath: {
      title: "",
      description: "",
    },
    exportBlacklist: {
      title: "",
      description: "",
    },
    openAfterExport: {
      title: "",
      description: "",
    },
    exportVault: {
      title: "",
      description: "",
      button: "",
      buttonWorking: "",
    },
    copyDebug: {
      title: "",
      description: "",
    },
  },
};

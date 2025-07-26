import { TFile } from "obsidian";

import ObsidianApp from "src/shared/app";
import { Attachment } from "src/plugin/utils/downloadable";
import { ExportPipelineOptions } from "src/plugin/website/pipeline-options";
import { AssetHandler } from "src/plugin/asset-loaders/asset-handler";
import { ExportLog } from "src/plugin/render-api/render-api";
import { Path } from "src/plugin/utils/path";
import HTMLExportPlugin from "src/plugin/main";
import { AssetType } from "src/plugin/asset-loaders/asset-types";
import { AssetLoader } from "src/plugin/asset-loaders/base-asset";
import { FileData, WebpageData, WebsiteData } from "src/shared/website-data";
import { Shared } from "src/shared/shared";

import { Website } from "./website";
import { Webpage } from "./webpage";
import { WebpageTemplate } from "./webpage-template";

export class Index {
  private website: Website;
  private sourceToWebpage: Map<string, Webpage> = new Map();
  private sourceToAttachment: Map<string, Attachment> = new Map();
  private exportOptions: ExportPipelineOptions;

  public webpages: Webpage[] = [];
  public attachments: Attachment[] = [];
  public assets: Attachment[] = [];

  public oldWebsiteData: WebsiteData | undefined = undefined;
  public websiteData: WebsiteData = {} as WebsiteData;

  public deletedFiles: string[] = [];
  public allFiles: Attachment[] = [];

  public async load(website: Website, options: ExportPipelineOptions) {
    this.website = website;
    this.exportOptions = options;

    try {
      // try to load website data
      const metadataPath = this.website.destination.join(AssetHandler.libraryPath).joinString(Shared.metadataFileName);

      const metadata = await metadataPath.readAsString();
      if (metadata) {
        this.oldWebsiteData = JSON.parse(metadata) as WebsiteData;
        this.websiteData = JSON.parse(metadata) as WebsiteData;
        this.deletedFiles = this.oldWebsiteData.allFiles ?? [];
      } else {
        console.log("No metadata found. Creating new metadata.");
        this.websiteData = {} as WebsiteData;
        this.websiteData.createdTime = Date.now();
      }

      // default values
      if (!this.websiteData.attachments) {
        this.websiteData.attachments = [];
      }
      if (!this.websiteData.allFiles) {
        this.websiteData.allFiles = [];
      }
      if (!this.websiteData.webpages) {
        this.websiteData.webpages = {};
      }
      if (!this.websiteData.fileInfo) {
        this.websiteData.fileInfo = {};
      }
      if (!this.websiteData.sourceToTarget) {
        this.websiteData.sourceToTarget = {};
      }
      this.websiteData.documentWidth = options.documentWidth;

      // set global values
      this.websiteData.modifiedTime = Date.now();
      this.websiteData.siteName = this.website.exportOptions.siteName ?? "";
      this.websiteData.vaultName = ObsidianApp.app.vault.getName();
      this.websiteData.baseURL = "";
      this.websiteData.pluginVersion = HTMLExportPlugin.pluginVersion;
      this.websiteData.themeName = this.website.exportOptions.themeName ?? "Default";
      this.websiteData.bodyClasses = await WebpageTemplate.getValidBodyClasses() ?? "";
      this.websiteData.hasFavicon = this.exportOptions.faviconPath !== "";
    } catch (e) {
      ExportLog.warning(e, "Failed to load metadata.json. Recreating metadata.");
    }
  }

  public async finalize() {
    this.websiteData.allFiles = this.allFiles.map(file => file.targetPath.path);

    // remove deleted files from website data
    for (const file of this.deletedFiles) {
      delete this.websiteData.fileInfo[file];
      delete this.websiteData.webpages[file];

      this.websiteData.attachments.remove(file);
      this.websiteData.allFiles.remove(file);

      const webpages = Object.values(this.websiteData.webpages);
      for (const webpage of webpages) {
        webpage.attachments.remove(file);
      }
    }
  }

  /**
   * Simply deletes metadata.json and search-index.json
   */
  public async clearCache() {
    const metadataPath = this.website.destination.join(AssetHandler.libraryPath).joinString(Shared.metadataFileName);
    await metadataPath.delete();
  }

  public async addFile(file: Attachment | Webpage) {
    const key = file.targetPath.path;
    let isUpdated = false;

    this.deletedFiles.remove(file.targetPath.path);

    const isAsset = file.targetPath.path.includes(Shared.libFolderName);
    const isUninitialized = file.hash === "";
    const isEmpty = file.hash === "d41d8cd98f00b204e9800998ecf8427e";
    const isExisting = this.hadFile(key);

    if (!isEmpty && !isUninitialized && !isAsset && (!isExisting || (isExisting && file.hash !== this.getOldFile(key)?.hash))) {
      isUpdated = true;
    }

    // add the file to the list of all files
    if (!this.allFiles.includes(file)) {
      this.allFiles.push(file);
    }

    if (file instanceof Webpage && file.sourcePath && !this.sourceToWebpage.has(file.sourcePath)) {
      this.sourceToWebpage.set(file.sourcePath, file);
    }

    if (file instanceof Attachment && file.sourcePath && !this.sourceToAttachment.has(file.sourcePath)) {
      this.sourceToAttachment.set(file.sourcePath, file);
    }

    if (file instanceof Webpage) {
      await this.updateWebpage(file);
    } else if (isAsset && (!isExisting || (isExisting && file.sourceStat.size !== this.getOldFile(key)?.sourceSize))) {
      this.updateAsset(file);
    } else if (isUpdated) {
      this.updateAttachment(file);
    }
  }

  public async addFiles(files: (Attachment | Webpage)[]) {
    for (const file of files) {
      this.addFile(file);
    }
  }

  public async removeFile(file: Attachment | Webpage) {
    if (file instanceof Webpage) {
      this.removeWebpage(file);
    } else {
      this.removeAttachment(file);
    }
  }

  public async removeFiles(files: (Attachment | Webpage)[]) {
    for (const file of files) {
      this.removeFile(file);
    }
  }

  public getFileFromSrc(src: string, sourceFile: TFile): Attachment | undefined {
    const attachedFile = this.website.getFilePathFromSrc(src, sourceFile.path);
    return this.getFile(attachedFile.pathname);
  }

  public getAttachment(sourcePath: string): Attachment | undefined {
    return this.sourceToAttachment.get(sourcePath);
  }

  public getWebpage(sourcePath: string): Webpage | undefined {
    return this.sourceToWebpage.get(sourcePath);
  }

  public getFile(sourcePath: string, preferAttachment: boolean = false): Attachment | Webpage | undefined {
    if (preferAttachment) {
      return this.sourceToAttachment.get(sourcePath) ?? this.sourceToWebpage.get(sourcePath);
    }

    return this.sourceToWebpage.get(sourcePath) ?? this.sourceToAttachment.get(sourcePath);
  }

  public hasFile(sourcePath: string): boolean {
    return this.sourceToWebpage.has(sourcePath);
  }

  public hadFile(targetPath: string): boolean {
    return this.oldWebsiteData?.fileInfo[targetPath] != undefined;
  }

  public getOldFile(targetPath: string): FileData | undefined {
    return this.oldWebsiteData?.fileInfo[targetPath];
  }

  public getOldWebpage(targetPath: string): WebpageData | undefined {
    return this.oldWebsiteData?.webpages[targetPath];
  }

  private async addWebpageToWebsiteData(webpage: Webpage) {
    if (webpage.sourcePath && this.websiteData) {
      const webpageInfo: WebpageData = {} as WebpageData;
      webpageInfo.title = webpage.title;
      webpageInfo.icon = webpage.icon;
      webpageInfo.description = webpage.outputData.descriptionOrShortenedContent;
      webpageInfo.aliases = webpage.outputData.aliases;
      webpageInfo.inlineTags = webpage.outputData.inlineTags;
      webpageInfo.frontmatterTags = webpage.outputData.frontmatterTags;
      webpageInfo.headers = await webpage.outputData.renderedHeadings;
      webpageInfo.links = webpage.outputData.linksToOtherFiles;
      webpageInfo.author = webpage.outputData.author;
      webpageInfo.coverImageURL = "";
      webpageInfo.fullURL = webpage.outputData.fullURL;
      webpageInfo.pathToRoot = webpage.outputData.pathToRoot == "" ? "." : webpage.outputData.pathToRoot;
      webpageInfo.attachments = webpage.attachments.map(download => download.targetPath.path);

      webpageInfo.createdTime = webpage.source.stat.ctime;
      webpageInfo.modifiedTime = webpage.source.stat.mtime;
      webpageInfo.sourceSize = webpage.source.stat.size;
      webpageInfo.sourcePath = new Path(webpage.source.path).path;
      webpageInfo.exportPath = webpage.targetPath.path;
      webpageInfo.type = webpage.type;
      webpageInfo.hash = webpage.outputData.hash;

      // get file info version of the webpage
      const fileInfo: FileData = {} as FileData;
      fileInfo.createdTime = webpageInfo.createdTime;
      fileInfo.modifiedTime = webpageInfo.modifiedTime;
      fileInfo.sourceSize = webpageInfo.sourceSize;
      fileInfo.sourcePath = webpageInfo.sourcePath;
      fileInfo.exportPath = webpageInfo.exportPath;
      fileInfo.type = webpageInfo.type;
      fileInfo.hash = webpage.outputData.hash;
      delete fileInfo.data;

      this.websiteData.webpages[webpageInfo.exportPath] = webpageInfo;
      this.websiteData.fileInfo[webpageInfo.exportPath] = fileInfo;
      this.websiteData.sourceToTarget[webpageInfo.sourcePath] = webpageInfo.exportPath;
    }
  }

  private async updateWebpage(webpage: Webpage) {
    if (!this.webpages.includes(webpage)) {
      this.webpages.push(webpage);
    }

    await this.addWebpageToWebsiteData(webpage);
  }

  private addAttachmentToWebsiteData(attachment: Attachment): string {
    const exportPath = attachment.targetPath.path;
    const key = exportPath;

    if (this.websiteData) {
      const fileInfo: FileData = {} as FileData;
      fileInfo.createdTime = attachment.sourceStat.ctime;
      fileInfo.modifiedTime = attachment.sourceStat.mtime;
      fileInfo.sourceSize = attachment.sourceStat.size;
      fileInfo.sourcePath = attachment.sourcePath ?? "";
      fileInfo.exportPath = exportPath;
      fileInfo.type = AssetLoader.extensionToType(attachment.targetPath.extension);
      fileInfo.hash = attachment.hash;
      delete fileInfo.data;

      this.websiteData.fileInfo[key] = fileInfo;
      if (!this.websiteData.attachments.includes(key)) {
        this.websiteData.attachments.push(key);
      }
      this.websiteData.sourceToTarget[fileInfo.sourcePath] = fileInfo.exportPath;
    }

    return key;
  }

  private updateAttachment(attachment: Attachment) {
    this.addAttachmentToWebsiteData(attachment);

    if (!this.attachments.includes(attachment)) {
      this.attachments.push(attachment);
    }
  }

  private addAssetToWebsiteData(attachment: Attachment): string {
    const exportPath = attachment.targetPath.path;
    const key = exportPath;

    if (this.websiteData) {
      const fileInfo: FileData = {} as FileData;
      fileInfo.createdTime = attachment.sourceStat.ctime;
      fileInfo.modifiedTime = attachment.sourceStat.mtime;
      fileInfo.sourceSize = attachment.sourceStat.size;
      fileInfo.sourcePath = attachment.sourcePath ?? "";
      fileInfo.exportPath = exportPath;
      fileInfo.type = AssetLoader.extensionToType(attachment.targetPath.extension);
      fileInfo.hash = attachment.hash;
      delete fileInfo.data;

      this.websiteData.fileInfo[key] = fileInfo;
      this.websiteData.sourceToTarget[fileInfo.sourcePath] = fileInfo.exportPath;
    }

    return key;
  }

  private updateAsset(attachment: Attachment) {
    this.addAssetToWebsiteData(attachment);

    if (!this.assets.includes(attachment)) {
      this.assets.push(attachment);
    }
  }

  private removeWebpage(webpage: Webpage) {
    if (webpage.sourcePath && !this.sourceToWebpage.has(webpage.sourcePath)) {
      this.sourceToWebpage.delete(webpage.sourcePath);
    }

    const key = webpage.targetPath.path;
    delete this.websiteData.webpages[key];
    delete this.websiteData.fileInfo[key];
  }

  private removeAttachment(attachment: Attachment) {
    if (attachment.sourcePath && !this.sourceToAttachment.has(attachment.sourcePath)) {
      this.sourceToAttachment.delete(attachment.sourcePath);
    }

    const key = attachment.targetPath.path;
    delete this.websiteData.fileInfo[key];
  }

  public websiteDataAttachment(): Attachment {
    const websiteDataString = JSON.stringify(this.websiteData);
    const websiteDataPath = AssetHandler.generateSavePath("metadata.json", AssetType.Other, this.website.destination);
    return new Attachment(websiteDataString, websiteDataPath, null, this.exportOptions);
  }
}

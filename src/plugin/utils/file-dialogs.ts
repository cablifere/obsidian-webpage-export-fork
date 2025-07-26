import { Settings, SettingsPage } from "src/plugin/settings/settings";
import { Path } from "./path";
/* @ts-ignore */
const dialog: Electron.Dialog = require("electron").remote.dialog;

export namespace FileDialogs {
  export async function showSelectFolderDialog(defaultPath: Path): Promise<Path | undefined> {
    if (!defaultPath.exists) {
      defaultPath = Path.vaultPath;
    }
    defaultPath.makePlatformSafe();

    // show picker
    const picker = await dialog.showOpenDialog({
      defaultPath: defaultPath.directory.path,
      properties: ["openDirectory"]
    });

    if (picker.canceled) {
      return;
    }

    const path = new Path(picker.filePaths[0]).makePlatformSafe();
    Settings.exportOptions.exportPath = path.directory.path;
    SettingsPage.saveSettings();

    return path;
  }

  export async function showSelectFileDialog(defaultPath: Path): Promise<Path | undefined> {
    if (!defaultPath.exists) {
      defaultPath = this.idealAbsoluteDefaultPath();
    }
    defaultPath.makePlatformSafe();

    // show picker
    const picker = await dialog.showOpenDialog({
      defaultPath: defaultPath.directory.path,
      properties: ["openFile"]
    });

    if (picker.canceled) {
      return;
    }

    const path = new Path(picker.filePaths[0]).makePlatformSafe();
    return path;
  }

  export function idealAbsoluteDefaultPath() : Path {
    let lastPath = new Path(Settings.exportOptions.exportPath);

    if (lastPath.path != "" && lastPath.exists) {
      lastPath = lastPath.directory;
    } else {
      lastPath = Path.vaultPath;
    }
    return lastPath.makePlatformSafe().absoluted();
  }
}

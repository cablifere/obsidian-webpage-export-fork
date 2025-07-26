import { Setting, TextComponent, ButtonComponent } from "obsidian";

import { Path } from "src/plugin/utils/path";
import { FileDialogs } from "src/plugin/utils/file-dialogs";
import { i18n } from "src/plugin/translations/language";

import { SettingsPage } from "./settings";

export function createDivider(container: HTMLElement) {
  const hr = container.createEl("hr");
  hr.style.marginTop = "20px";
  hr.style.marginBottom = "20px";
  hr.style.borderColor = "var(--interactive-accent)";
  hr.style.opacity = "0.5";
}

export function createToggle(container: HTMLElement, name: string, get: () => boolean, set: (value: boolean) => void, desc: string = ""): Setting {
  const setting = new Setting(container);
  setting.setName(name);
  if (desc !== "") {
    setting.setDesc(desc);
  }
  setting.addToggle(toggle => toggle
    .setValue(get())
    .onChange(async (value) => {
      set(value);
      await SettingsPage.saveSettings();
    }));
  return setting;
}

export function createText(container: HTMLElement, name: string, get: () => string, set: (value: string) => void, desc: string = "", validation?: (value: string) => string): Setting {
  const setting = new Setting(container);
  const errorText = createError(container);

  const value = get();
  if (value !== "") {
    errorText.setText(validation ? validation(value) : "");
  }

  setting.setName(name);
  if (desc !== "") {
    setting.setDesc(desc);
  }
  setting.addText(text => text
    .setValue(value)
    .onChange(async (value) => {
      const error = validation ? validation(value) : "";
      if (error === "") {
        set(value);
        await SettingsPage.saveSettings();
      }

      errorText.setText(error);
    }));

  return setting;
}

export function createButton(container: HTMLElement, name: string, desc: string = "", buttonOptions: { name?: string, icon?: string, onClick: (button: ButtonComponent) => void }): Setting {
  const setting = new Setting(container);
  setting.setName(name);
  if (desc !== "") {
    setting.setDesc(desc);
  }
  setting.addButton((button) => {
    if (buttonOptions.name && buttonOptions.name !== "") {
      button.setButtonText(buttonOptions.name);
    }
    if (buttonOptions.icon && buttonOptions.icon !== "") {
      button.setIcon(buttonOptions.icon);
    }
    button.onClick(() => buttonOptions.onClick(button));
  });
  return setting;
}

export function createDropdown(container: HTMLElement, name: string, get: () => string, set: (value: string) => void, options: Record<string, string>, desc: string = ""): Setting {
  // swap the record keys and values
  const newOptions: Record<string, string> = {};
  for (const key in options) {
    newOptions[options[key]] = key;
  }

  const setting = new Setting(container);
  setting.setName(name);
  if (desc !== "") {
    setting.setDesc(desc);
  }
  setting.addDropdown(dropdown => dropdown
    .addOptions(newOptions)
    .setValue(get())
    .onChange(async (value) => {
      set(value);
      await SettingsPage.saveSettings();
    }));
  return setting;
}

export function createError(container: HTMLElement): HTMLElement {
  const error = container.createDiv({ cls: "setting-item-description" });
  error.style.color = "var(--color-red)";
  error.style.marginBottom = "0.75rem";
  return error;
}

export function createFileInput(
  container: HTMLElement, get: () => string, set: (value: string) => void,
  options?: { name?: string, description?: string, placeholder?: string, defaultPath?: Path, makeRelativeToVault?: boolean, pickFolder?: boolean, validation?: (path: Path) => { valid: boolean, isEmpty: boolean, error: string }, browseButton?: boolean, onChanged?: (path: Path) => void },
): { fileInput: Setting, textInput: TextComponent, browseButton: HTMLElement | undefined } {
  const getSafe = () => new Path(get() ?? "").makePlatformSafe();
  const setSafe = (value: string) => set(new Path(value).makePlatformSafe().path);

  const name = options?.name ?? "";
  const description = options?.description ?? "";
  const placeholder = options?.placeholder ?? "Path to file...";
  const defaultPath = options?.defaultPath ?? Path.vaultPath;
  const makeRelativeToVault = options?.makeRelativeToVault ?? false;
  const pickFolder = options?.pickFolder ?? false;
  const validation = options?.validation ?? (() => ({ valid: true, isEmpty: false, error: "" }));
  const browseButton = options?.browseButton ?? true;
  const onChanged = options?.onChanged;

  const errorMessage = createError(container);
  if (!getSafe().isEmpty) {
    errorMessage.setText(validation(getSafe()).error);
  }

  let textInput: TextComponent | undefined = undefined;

  const fileInput = new Setting(container);
  if (name !== "") {
    fileInput.setName(name);
  }
  if (description !== "") {
    fileInput.setDesc(description);
  }
  if (name === "" && description === "") {
    fileInput.infoEl.style.display = "none";
  }

  let textEl: TextComponent;
  fileInput.addText((text) => {
    textEl = text;
    textInput = text;
    text.inputEl.style.width = "100%";
    text.setPlaceholder(placeholder)
      .setValue(getSafe().path)
      .onChange(async (value) => {
        const path = new Path(value).makePlatformSafe();
        const valid = validation(path);
        errorMessage.setText(valid.error);
        if (valid.valid) {
          errorMessage.setText("");
          setSafe(value.replaceAll("\"", ""));
          await SettingsPage.saveSettings();
        }

        if (onChanged) {
          onChanged(path);
        }
      });
  });

  let browseButtonEl = undefined;
  if (browseButton) {
    fileInput.addButton((button) => {
      browseButtonEl = button.buttonEl;
      button.setButtonText(i18n.browse).onClick(async () => {
        let path = pickFolder ? await FileDialogs.showSelectFolderDialog(defaultPath) : await FileDialogs.showSelectFileDialog(defaultPath);

        if (!path) {
          return;
        }

        if (makeRelativeToVault) {
          path = Path.getRelativePathFromVault(path, true);
        }

        path.makePlatformSafe();

        const valid = validation(path);
        errorMessage.setText(valid.error);
        if (valid.valid) {
          setSafe(path.path);
          await SettingsPage.saveSettings();
          textInput?.setValue(path.path);
        }

        if (onChanged) {
          onChanged(path);
        }
        // textInput?.onChanged();
      });
    });
  }

  container.appendChild(errorMessage);

  return {
    fileInput: fileInput,
    textInput: textEl!,
    browseButton: browseButtonEl,
  };
}

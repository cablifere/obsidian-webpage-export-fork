import { Path } from './path';
import { Attachment } from './downloadable';
import { ExportLog } from 'src/plugin/render-api/render-api';

export namespace Utils {

	export async function delay (ms: number) {
		return new Promise( resolve => setTimeout(resolve, ms) );
	}

	export async function urlAvailable(url: RequestInfo | URL) {
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), 4000);

		const response = await fetch(url, {signal: controller.signal, mode: "no-cors"});
		clearTimeout(id);

		return response;
	}

	export async function downloadAttachments(files: Attachment[]) {
		ExportLog.addToProgressCap(files.length);
		ExportLog.progress(0, "Saving files to disk", "...", "var(--color-green)");

		await Promise.all(files.map(async (file, i) => {
			try {
				ExportLog.progress(1, "Saving files to disk", "Saved: " + file.filename, "var(--color-green)");
				await file.download();
			} catch (e) {
				ExportLog.error(e, "Could not save file: " + file.filename);
			}
		}));
	}

	// export async function that awaits until a condition is met
	export async function waitUntil(condition: () => boolean, timeout: number = 1000, interval: number = 100): Promise<boolean> {
		if (condition()) return true;

		return new Promise((resolve, reject) => {
			let timer = 0;
			const intervalId = setInterval(() => {
				if (condition()) {
					clearInterval(intervalId);
					resolve(true);
				} else {
					timer += interval;
					if (timer >= timeout) {
						clearInterval(intervalId);
						resolve(false);
					}
				}
			}, interval);
		});
	}

	export function trimEnd(inputString: string, trimString: string): string {
		return inputString.endsWith(trimString) ? inputString.substring(0, inputString.length - trimString.length) : inputString;
	}

	export function trimStart(inputString: string, trimString: string): string {
		return inputString.startsWith(trimString) ? inputString.substring(trimString.length) : inputString;
	}

	export async function openPath(path: Path) {
		if (process.platform === "win32") {
			path = path.backslashified()
		}
		// @ts-ignore
		await window.electron.remote.shell.openPath(path.path);
	}
}

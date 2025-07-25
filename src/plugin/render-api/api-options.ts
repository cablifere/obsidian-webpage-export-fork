
/**
 * General options for the MarkdownRendererAPI
 */
export class MarkdownRendererOptions
{
	/**
	 * The container to render the HTML into.
	 */
	container: HTMLElement | undefined = undefined;

	/**
	 * Add the file's icon to the page header
	 */
	addPageIcon: boolean = true;

	/**
	 * Modify the title to a unified format.
	 */
	unifyTitleFormat: boolean = true;

	/**
	 * Display a window with a log and progress bar.
	 */
	displayProgress: boolean = true;

	/**
	 * Inline / embed other HTML directly into the HTML.
	 */
	inlineHTML: boolean = false;

	/**
	 * The path to export the files to.
	 */
	exportPath: string = "";

	/**
	 * Should the usage of the fallback rendering method which iterates all document sections be forced?
	 */
	useFallbackRenderer: boolean = false;
}

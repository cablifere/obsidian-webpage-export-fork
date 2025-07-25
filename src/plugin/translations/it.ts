import { i18n } from "./language";

export const language: i18n = {
	cancel: "Annulla",
	browse: "Sfoglia",
	pathInputPlaceholder: "Digita o sfoglia un percorso...",
	pathValidations: {
		noEmpty: "Il percorso non può essere vuoto",
		mustExist: "Il percorso non esiste",
		noTilde: "La directory home con tilde (~) non è consentita",
		noAbsolute: "Il percorso non può essere assoluto",
		noRelative: "Il percorso non può essere relativo",
		noFiles: "Il percorso non può essere un file",
		noFolders: "Il percorso non può essere una directory",
		mustHaveExtension: "Il percorso deve avere estensione: {0}"
	},
	updateAvailable: "Aggiornamento disponibile",
	exportAsHTML: "Esporta come HTML",
	settings: {
		title: "Impostazioni Esportazione HTML",
		support: "Supporta lo sviluppo continuo di questo plugin.",
		debug: "Copia info di debug negli appunti",
		baseFeatures: {
			info_selector: "Selettore CSS per un elemento. La funzionalità verrà posizionata rispetto a questo elemento.",
			info_type: "Dove posizionare questa funzionalità: prima, dopo o dentro (all'inizio o alla fine).",
			info_displayTitle: "Titolo descrittivo da mostrare sopra la funzionalità",
			info_featurePlacement: "Dove posizionare questa funzionalità nella pagina. (Rispetto al selettore)"
		},
		document: {
			title: "Documento",
			description: "Controlla le impostazioni del documento",
			info_allowFoldingLists: "Permettere o meno il piegamento delle liste",
			info_allowFoldingHeadings: "Permettere o meno il piegamento dei titoli",
			info_documentWidth: "Larghezza del documento"
		},
		styleOptionsSection: {
			title: "Opzioni di Stile",
			description: "Configura quali stili includere nell'esportazione"
		},
		makeOfflineCompatible: {
			title: "Rendi compatibile offline",
			description: "Scarica risorse, immagini o script online per visualizzare la pagina offline o per non dipendere da una CDN."
		},
		includePluginCSS: {
			title: "Includi CSS dai plugin",
			description: "Includi il CSS dei seguenti plugin nell'HTML esportato. Se le funzionalità dei plugin non si visualizzano correttamente, prova ad aggiungere il plugin a questo elenco. Evita di aggiungere plugin se non noti problemi specifici, poiché più CSS aumenterà il tempo di caricamento della pagina."
		},
		includeStyleCssIds: {
			title: "Includi stili con ID",
			description: "Includi CSS dai tag di stile con i seguenti ID nell'HTML esportato."
		},
		generalSettingsSection: {
			title: "Impostazioni Generali",
			description: "Controlla impostazioni semplici come favicon e metadati del sito",
		},
		favicon: {
			title: "Immagine Favicon",
			description: "Il percorso locale della favicon per il sito",
		},
		siteName: {
			title: "Nome del Sito",
			description: "Il nome del vault / sito esportato",
		},
		iconEmojiStyle: {
			title: "Stile emoji per le icone",
			description: "Lo stile di emoji da utilizzare per le icone personalizzate",
		},
		themeName: {
			title: "Tema",
			description: "Il tema installato da utilizzare per l'esportazione",
		},
		exportSettingsSection: {
			title: "Impostazioni di Esportazione",
			description: "Controlla impostazioni tecniche più avanzate come la generazione dei link",
		},
		relativeHeaderLinks: {
			title: "Usa Link Relativi per i Titoli",
			description: "Usa link relativi per i titoli invece di link assoluti",
		},
		slugifyPaths: {
			title: "Percorsi Slugificati",
			description: "Rendi tutti i percorsi e i nomi dei file in stile web (minuscoli, senza spazi)",
		},
		addPageIcon: {
			title: "Aggiungi Icona Pagina",
			description: "Aggiungi l'icona del file all'intestazione della pagina",
		},
		logLevel: {
			title: "Livello di Log",
			description: "Imposta il livello di registrazione da visualizzare nella console",
		},
		titleProperty: {
			title: "Proprietà del Titolo",
			description: "La proprietà da utilizzare come titolo del documento",
		},
	}
};

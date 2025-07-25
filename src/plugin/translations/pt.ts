import { i18n } from "./language";

export const language: i18n = {
	cancel: "Cancelar",
	browse: "Procurar",
	pathInputPlaceholder: "Digite ou procure um caminho...",
	pathValidations: {
		noEmpty: "O caminho não pode estar vazio",
		mustExist: "O caminho não existe",
		noTilde: "Diretório inicial com til (~) não é permitido",
		noAbsolute: "O caminho não pode ser absoluto",
		noRelative: "O caminho não pode ser relativo",
		noFiles: "O caminho não pode ser um arquivo",
		noFolders: "O caminho não pode ser um diretório",
		mustHaveExtension: "O caminho deve ter a extensão: {0}",
	},
	updateAvailable: "Atualização disponível",
	exportAsHTML: "Exportar como HTML",
	settings:
	{
		title: "Configurações de Exportação HTML",
		support: "Apoie o desenvolvimento contínuo deste plugin.",
		debug: "Copiar informações de debug para a área de transferência",
		baseFeatures:
		{
			info_selector: "Seletor CSS de um elemento. O recurso será posicionado em relação a esse elemento.",
			info_type: "Este recurso será colocado antes, depois ou dentro (no início ou final).",
			info_displayTitle: "Título descritivo a ser exibido acima do recurso",
			info_featurePlacement: "Onde posicionar esse recurso na página. (Relativo ao seletor)",
		},
		documentWidth: {
			title: "Documento",
			description: "A largura do documento"
		},
		customHeadSourcePath: {
			title: "",
			description: ""
		},
		styleOptionsSection: {
			title: "Opções de Estilo",
			description: "Configure quais estilos serão incluídos na exportação"
		},
		makeOfflineCompatible: {
			title: "Tornar Compatível com Modo Offline",
			description: "Baixar recursos / imagens / scripts online para que a página funcione offline. Ou evitar dependência de CDNs."
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
			description: ""
		},
		includeJs: {
			title: "",
			description: ""
		},
		includeCss: {
			title: "",
			description: ""
		},
		inlineMedia: {
			title: "",
			description: ""
		},
		inlineJs: {
			title: "",
			description: ""
		},
		inlineCss: {
			title: "",
			description: ""
		},
		inlineFonts: {
			title: "",
			description: ""
		},
		inlineOther: {
			title: "",
			description: ""
		},
		includePluginCSS: {
			title: "Incluir CSS de Plugins",
			description: "Inclui CSS de plugins na exportação do HTML. Se recursos do plugin não renderizarem corretamente, adicione o plugin nessa lista. Evite adicionar plugins sem necessidade, pois isso aumenta o tempo de carregamento da sua página, quanto mais CSS for incluído."
		},
		includeStyleCssIds: {
			title: "Incluir Estilos com IDs",
			description: "Inclui CSS de tags de estilo com os IDs especificados"
		},
		generalSettingsSection:{
			title: "Configurações Gerais",
			description: "Controle configurações simples como favicon e metadados do site",
		},
		favicon: {
			title: "Imagem do Favicon",
			description: "Caminho local da imagem favicon do site",
		},
		siteName: {
			title: "Nome do Site",
			description: "Nome do cofre / site exportado",
		},
		iconEmojiStyle: {
			title: "Estilo de Emoji para Ícones",
			description: "Estilo de emoji usado para ícones personalizados",
		},
		themeName: {
			title: "Tema",
			description: "Tema instalado a ser usado na exportação",
		},
		relativeHeaderLinks: {
			title: "Usar Links Relativos para Cabeçalhos",
			description: "Utiliza links relativos em vez de absolutos para cabeçalhos",
		},
		slugifyPaths: {
			title: "Slugificar Caminhos",
			description: "Transformar caminhos e nomes de arquivos para formato web (minúsculo, sem espaços)",
		},
		addPageIcon: {
			title: "Adicionar Ícone à Página",
			description: "Adiciona o ícone do arquivo ao cabeçalho da página",
		},
		unifyTitleFormat: {
			title: "",
			description: "",
		},
		logLevel: {
			title: "Nível de Log",
			description: "Define o nível de detalhamento nos logs do console",
		},
		titleProperty: {
			title: "Propriedade de Título",
			description: "Propriedade a ser usada como título do documento",
		},
		exportPath: {
			title: "",
			description: "",
		},
		exportBlacklist: {
			title: "",
			description: "",
		}
	}
}

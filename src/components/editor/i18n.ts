/**
 * Editor Internationalization for the Web Help Component Library
 * @module @piikeep-pw/web-help/components/editor/i18n
 *
 * Provides i18n support for editor components with built-in translations
 * for common languages and the ability to add custom translations.
 */

import type { HelpEditorLabels } from './HelpEditor';
import type { HelpMetadataLabels } from './HelpMetadataEditor';
import type { HelpAssetUploadLabels } from './HelpAssetUpload';

/**
 * Combined editor labels.
 */
export interface EditorI18nLabels {
  editor: HelpEditorLabels;
  metadata: HelpMetadataLabels;
  assetUpload: HelpAssetUploadLabels;
}

/**
 * Supported locale codes.
 */
export type SupportedLocale = 'en' | 'es' | 'de' | 'fr' | 'pt' | 'zh' | 'ja';

/**
 * Built-in translations.
 */
const translations: Record<SupportedLocale, EditorI18nLabels> = {
  en: {
    editor: {
      title: 'Edit Article',
      contentLabel: 'Content',
      previewLabel: 'Preview',
      editLabel: 'Edit',
      saveLabel: 'Save Draft',
      publishLabel: 'Publish',
      cancelLabel: 'Cancel',
      metadataLabel: 'Metadata',
      autoSavedMessage: 'Auto-saved',
      unsavedWarning:
        'You have unsaved changes. Are you sure you want to leave?',
    },
    metadata: {
      category: 'Category',
      tags: 'Tags',
      author: 'Author',
      order: 'Order',
      published: 'Published',
      version: 'Version',
      slug: 'URL Slug',
      prevArticle: 'Previous Article',
      nextArticle: 'Next Article',
      relatedArticles: 'Related Articles',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      tagsPlaceholder: 'Enter tags separated by commas',
      relatedPlaceholder: 'Enter article IDs separated by commas',
    },
    assetUpload: {
      dropzone: 'Drag and drop files here, or click to browse',
      dropzoneActive: 'Drop files here',
      browse: 'Browse',
      uploading: 'Uploading...',
      uploadFailed: 'Upload failed',
      deleteConfirm: 'Are you sure you want to delete this asset?',
      fileTooLarge: 'File is too large',
      tooManyFiles: 'Too many files selected',
      invalidType: 'Invalid file type',
      noAssets: 'No assets uploaded',
    },
  },

  es: {
    editor: {
      title: 'Editar Artículo',
      contentLabel: 'Contenido',
      previewLabel: 'Vista previa',
      editLabel: 'Editar',
      saveLabel: 'Guardar Borrador',
      publishLabel: 'Publicar',
      cancelLabel: 'Cancelar',
      metadataLabel: 'Metadatos',
      autoSavedMessage: 'Guardado automático',
      unsavedWarning:
        'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
    },
    metadata: {
      category: 'Categoría',
      tags: 'Etiquetas',
      author: 'Autor',
      order: 'Orden',
      published: 'Publicado',
      version: 'Versión',
      slug: 'URL Slug',
      prevArticle: 'Artículo Anterior',
      nextArticle: 'Artículo Siguiente',
      relatedArticles: 'Artículos Relacionados',
      createdAt: 'Creado',
      updatedAt: 'Actualizado',
      tagsPlaceholder: 'Ingresa etiquetas separadas por comas',
      relatedPlaceholder: 'Ingresa IDs de artículos separados por comas',
    },
    assetUpload: {
      dropzone: 'Arrastra y suelta archivos aquí, o haz clic para buscar',
      dropzoneActive: 'Suelta los archivos aquí',
      browse: 'Buscar',
      uploading: 'Subiendo...',
      uploadFailed: 'Error al subir',
      deleteConfirm: '¿Estás seguro de que quieres eliminar este archivo?',
      fileTooLarge: 'El archivo es demasiado grande',
      tooManyFiles: 'Demasiados archivos seleccionados',
      invalidType: 'Tipo de archivo inválido',
      noAssets: 'No hay archivos subidos',
    },
  },

  de: {
    editor: {
      title: 'Artikel bearbeiten',
      contentLabel: 'Inhalt',
      previewLabel: 'Vorschau',
      editLabel: 'Bearbeiten',
      saveLabel: 'Entwurf speichern',
      publishLabel: 'Veröffentlichen',
      cancelLabel: 'Abbrechen',
      metadataLabel: 'Metadaten',
      autoSavedMessage: 'Automatisch gespeichert',
      unsavedWarning:
        'Sie haben ungespeicherte Änderungen. Sind Sie sicher, dass Sie gehen möchten?',
    },
    metadata: {
      category: 'Kategorie',
      tags: 'Tags',
      author: 'Autor',
      order: 'Reihenfolge',
      published: 'Veröffentlicht',
      version: 'Version',
      slug: 'URL Slug',
      prevArticle: 'Vorheriger Artikel',
      nextArticle: 'Nächster Artikel',
      relatedArticles: 'Verwandte Artikel',
      createdAt: 'Erstellt am',
      updatedAt: 'Aktualisiert am',
      tagsPlaceholder: 'Tags durch Kommas getrennt eingeben',
      relatedPlaceholder: 'Artikel-IDs durch Kommas getrennt eingeben',
    },
    assetUpload: {
      dropzone: 'Dateien hierher ziehen oder klicken zum Durchsuchen',
      dropzoneActive: 'Dateien hier ablegen',
      browse: 'Durchsuchen',
      uploading: 'Hochladen...',
      uploadFailed: 'Hochladen fehlgeschlagen',
      deleteConfirm: 'Sind Sie sicher, dass Sie diese Datei löschen möchten?',
      fileTooLarge: 'Datei ist zu groß',
      tooManyFiles: 'Zu viele Dateien ausgewählt',
      invalidType: 'Ungültiger Dateityp',
      noAssets: 'Keine Dateien hochgeladen',
    },
  },

  fr: {
    editor: {
      title: "Modifier l'article",
      contentLabel: 'Contenu',
      previewLabel: 'Aperçu',
      editLabel: 'Éditer',
      saveLabel: 'Enregistrer le brouillon',
      publishLabel: 'Publier',
      cancelLabel: 'Annuler',
      metadataLabel: 'Métadonnées',
      autoSavedMessage: 'Enregistré automatiquement',
      unsavedWarning:
        'Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter?',
    },
    metadata: {
      category: 'Catégorie',
      tags: 'Tags',
      author: 'Auteur',
      order: 'Ordre',
      published: 'Publié',
      version: 'Version',
      slug: 'URL Slug',
      prevArticle: 'Article précédent',
      nextArticle: 'Article suivant',
      relatedArticles: 'Articles connexes',
      createdAt: 'Créé le',
      updatedAt: 'Mis à jour le',
      tagsPlaceholder: 'Entrez les tags séparés par des virgules',
      relatedPlaceholder: "Entrez les IDs d'articles séparés par des virgules",
    },
    assetUpload: {
      dropzone:
        'Glissez et déposez des fichiers ici, ou cliquez pour parcourir',
      dropzoneActive: 'Déposez les fichiers ici',
      browse: 'Parcourir',
      uploading: 'Téléchargement...',
      uploadFailed: 'Échec du téléchargement',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce fichier?',
      fileTooLarge: 'Le fichier est trop volumineux',
      tooManyFiles: 'Trop de fichiers sélectionnés',
      invalidType: 'Type de fichier invalide',
      noAssets: 'Aucun fichier téléchargé',
    },
  },

  pt: {
    editor: {
      title: 'Editar Artigo',
      contentLabel: 'Conteúdo',
      previewLabel: 'Visualizar',
      editLabel: 'Editar',
      saveLabel: 'Salvar Rascunho',
      publishLabel: 'Publicar',
      cancelLabel: 'Cancelar',
      metadataLabel: 'Metadados',
      autoSavedMessage: 'Salvo automaticamente',
      unsavedWarning:
        'Você tem alterações não salvas. Tem certeza de que deseja sair?',
    },
    metadata: {
      category: 'Categoria',
      tags: 'Tags',
      author: 'Autor',
      order: 'Ordem',
      published: 'Publicado',
      version: 'Versão',
      slug: 'URL Slug',
      prevArticle: 'Artigo Anterior',
      nextArticle: 'Próximo Artigo',
      relatedArticles: 'Artigos Relacionados',
      createdAt: 'Criado em',
      updatedAt: 'Atualizado em',
      tagsPlaceholder: 'Digite tags separadas por vírgulas',
      relatedPlaceholder: 'Digite IDs de artigos separados por vírgulas',
    },
    assetUpload: {
      dropzone: 'Arraste e solte arquivos aqui, ou clique para procurar',
      dropzoneActive: 'Solte os arquivos aqui',
      browse: 'Procurar',
      uploading: 'Enviando...',
      uploadFailed: 'Falha no envio',
      deleteConfirm: 'Tem certeza de que deseja excluir este arquivo?',
      fileTooLarge: 'O arquivo é muito grande',
      tooManyFiles: 'Muitos arquivos selecionados',
      invalidType: 'Tipo de arquivo inválido',
      noAssets: 'Nenhum arquivo enviado',
    },
  },

  zh: {
    editor: {
      title: '编辑文章',
      contentLabel: '内容',
      previewLabel: '预览',
      editLabel: '编辑',
      saveLabel: '保存草稿',
      publishLabel: '发布',
      cancelLabel: '取消',
      metadataLabel: '元数据',
      autoSavedMessage: '已自动保存',
      unsavedWarning: '您有未保存的更改。确定要离开吗？',
    },
    metadata: {
      category: '分类',
      tags: '标签',
      author: '作者',
      order: '排序',
      published: '已发布',
      version: '版本',
      slug: 'URL Slug',
      prevArticle: '上一篇文章',
      nextArticle: '下一篇文章',
      relatedArticles: '相关文章',
      createdAt: '创建时间',
      updatedAt: '更新时间',
      tagsPlaceholder: '输入标签，用逗号分隔',
      relatedPlaceholder: '输入文章ID，用逗号分隔',
    },
    assetUpload: {
      dropzone: '拖放文件到这里，或点击浏览',
      dropzoneActive: '将文件拖放到这里',
      browse: '浏览',
      uploading: '上传中...',
      uploadFailed: '上传失败',
      deleteConfirm: '确定要删除此文件吗？',
      fileTooLarge: '文件太大',
      tooManyFiles: '选择的文件太多',
      invalidType: '无效的文件类型',
      noAssets: '暂无上传文件',
    },
  },

  ja: {
    editor: {
      title: '記事を編集',
      contentLabel: 'コンテンツ',
      previewLabel: 'プレビュー',
      editLabel: '編集',
      saveLabel: '下書きを保存',
      publishLabel: '公開',
      cancelLabel: 'キャンセル',
      metadataLabel: 'メタデータ',
      autoSavedMessage: '自動保存済み',
      unsavedWarning: '保存されていない変更があります。本当に離れますか？',
    },
    metadata: {
      category: 'カテゴリ',
      tags: 'タグ',
      author: '著者',
      order: '順序',
      published: '公開済み',
      version: 'バージョン',
      slug: 'URL Slug',
      prevArticle: '前の記事',
      nextArticle: '次の記事',
      relatedArticles: '関連記事',
      createdAt: '作成日',
      updatedAt: '更新日',
      tagsPlaceholder: 'タグをカンマで区切って入力',
      relatedPlaceholder: '記事IDをカンマで区切って入力',
    },
    assetUpload: {
      dropzone: 'ファイルをドラッグ＆ドロップ、またはクリックして参照',
      dropzoneActive: 'ここにファイルをドロップ',
      browse: '参照',
      uploading: 'アップロード中...',
      uploadFailed: 'アップロード失敗',
      deleteConfirm: 'このファイルを削除してもよろしいですか？',
      fileTooLarge: 'ファイルが大きすぎます',
      tooManyFiles: '選択したファイルが多すぎます',
      invalidType: '無効なファイル形式',
      noAssets: 'アップロードされたファイルはありません',
    },
  },
};

/**
 * Custom translations store.
 */
const customTranslations: Map<string, Partial<EditorI18nLabels>> = new Map();

/**
 * Get labels for a locale.
 * @param locale - Locale code
 * @returns Labels for the locale, falling back to English
 */
export function getEditorLabels(locale: string): EditorI18nLabels {
  // Check for custom translations first
  const custom = customTranslations.get(locale);

  // Get base translation
  const baseLocale = locale.split('-')[0] as SupportedLocale;
  const base = translations[baseLocale] ?? translations.en;

  // Merge custom with base
  if (custom) {
    return {
      editor: { ...base.editor, ...custom.editor },
      metadata: { ...base.metadata, ...custom.metadata },
      assetUpload: { ...base.assetUpload, ...custom.assetUpload },
    };
  }

  return base;
}

/**
 * Add or update translations for a locale.
 * @param locale - Locale code
 * @param labels - Partial labels to add
 */
export function addEditorTranslation(
  locale: string,
  labels: Partial<EditorI18nLabels>,
): void {
  const existing = customTranslations.get(locale) ?? {};
  customTranslations.set(locale, {
    editor: { ...existing.editor, ...labels.editor },
    metadata: { ...existing.metadata, ...labels.metadata },
    assetUpload: { ...existing.assetUpload, ...labels.assetUpload },
  });
}

/**
 * Get all supported locales.
 */
export function getSupportedLocales(): SupportedLocale[] {
  return Object.keys(translations) as SupportedLocale[];
}

/**
 * Check if a locale is supported.
 */
export function isLocaleSupported(locale: string): boolean {
  const baseLocale = locale.split('-')[0];
  return baseLocale in translations || customTranslations.has(locale);
}

export default translations;

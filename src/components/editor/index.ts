/**
 * Editor Components Index for the Web Help Component Library
 * @module @piikeep-pw/web-help/components/editor
 */

// Components
export { HelpEditor, default as HelpEditorDefault } from './HelpEditor';
export {
  HelpMetadataEditor,
  default as HelpMetadataEditorDefault,
  allFields,
  defaultFields,
} from './HelpMetadataEditor';
export {
  HelpAssetUpload,
  default as HelpAssetUploadDefault,
  getAssetTypeFromMime,
} from './HelpAssetUpload';

// i18n
export {
  getEditorLabels,
  addEditorTranslation,
  getSupportedLocales,
  isLocaleSupported,
} from './i18n';

// Types
export type {
  HelpEditorProps,
  HelpEditorLabels,
  HelpEditorState,
} from './HelpEditor';

export type {
  HelpMetadataEditorProps,
  HelpMetadataLabels,
  MetadataField,
  FieldRenderer,
  FieldRendererProps,
  MetadataValidation,
} from './HelpMetadataEditor';

export type {
  HelpAssetUploadProps,
  HelpAssetUploadLabels,
  Asset,
  UploadResult,
} from './HelpAssetUpload';

export type { EditorI18nLabels, SupportedLocale } from './i18n';

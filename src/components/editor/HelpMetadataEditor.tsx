/**
 * Metadata Editor Component for the Web Help Component Library
 * @module @piikeep-pw/web-help/components/editor/HelpMetadataEditor
 *
 * A headless metadata editor component that provides form fields
 * for editing article metadata with validation and i18n support.
 */

import React, { useCallback } from 'react';
import type { HelpArticleMetadata } from '../../core/types/content';

/**
 * Props for the HelpMetadataEditor component.
 */
export interface HelpMetadataEditorProps {
  /** Current metadata values */
  metadata: HelpArticleMetadata;
  /** Called when metadata changes */
  onChange: (metadata: HelpArticleMetadata) => void;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Labels for internationalization */
  labels?: HelpMetadataLabels;
  /** Fields to show (defaults to all) */
  fields?: MetadataField[];
  /** Custom field renderers */
  fieldRenderers?: Partial<Record<MetadataField, FieldRenderer>>;
  /** Validation rules */
  validation?: MetadataValidation;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Metadata field types.
 */
export type MetadataField =
  | 'category'
  | 'tags'
  | 'author'
  | 'order'
  | 'published'
  | 'version'
  | 'slug'
  | 'prevArticle'
  | 'nextArticle'
  | 'relatedArticles'
  | 'createdAt'
  | 'updatedAt';

/**
 * Custom field renderer function.
 */
export type FieldRenderer = (props: FieldRendererProps) => React.ReactNode;

/**
 * Props passed to field renderer.
 */
export interface FieldRendererProps {
  field: MetadataField;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly: boolean;
  error?: string;
  label: string;
}

/**
 * Labels for metadata editor internationalization.
 */
export interface HelpMetadataLabels {
  category?: string;
  tags?: string;
  author?: string;
  order?: string;
  published?: string;
  version?: string;
  slug?: string;
  prevArticle?: string;
  nextArticle?: string;
  relatedArticles?: string;
  createdAt?: string;
  updatedAt?: string;
  tagsPlaceholder?: string;
  relatedPlaceholder?: string;
}

/**
 * Validation rules for metadata fields.
 */
export interface MetadataValidation {
  /** Required fields */
  required?: MetadataField[];
  /** Custom validators */
  validators?: Partial<
    Record<MetadataField, (value: unknown) => string | null>
  >;
}

/**
 * Default labels.
 */
const defaultLabels: Required<HelpMetadataLabels> = {
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
};

/**
 * Default fields to show.
 */
const defaultFields: MetadataField[] = [
  'category',
  'tags',
  'author',
  'order',
  'published',
];

/**
 * All available fields.
 */
const allFields: MetadataField[] = [
  'category',
  'tags',
  'author',
  'order',
  'published',
  'version',
  'slug',
  'prevArticle',
  'nextArticle',
  'relatedArticles',
  'createdAt',
  'updatedAt',
];

/**
 * HelpMetadataEditor component - A headless metadata editor.
 */
export const HelpMetadataEditor: React.FC<HelpMetadataEditorProps> = ({
  metadata,
  onChange,
  readOnly = false,
  labels: customLabels,
  fields = defaultFields,
  fieldRenderers = {},
  validation,
  className,
}) => {
  const labels = { ...defaultLabels, ...customLabels };

  // Validate a field
  const validateField = useCallback(
    (field: MetadataField, value: unknown): string | null => {
      // Check required
      if (validation?.required?.includes(field)) {
        if (value === undefined || value === null || value === '') {
          return `${labels[field]} is required`;
        }
      }

      // Check custom validator
      const validator = validation?.validators?.[field];
      if (validator) {
        return validator(value);
      }

      return null;
    },
    [validation, labels],
  );

  // Handle field change
  const handleFieldChange = useCallback(
    (field: MetadataField, value: unknown) => {
      const newMetadata = { ...metadata, [field]: value };
      onChange(newMetadata);
    },
    [metadata, onChange],
  );

  // Render a field
  const renderField = (field: MetadataField) => {
    const value = metadata[field as keyof HelpArticleMetadata];
    const error = validateField(field, value);
    const label = labels[field] ?? field;

    // Use custom renderer if provided
    const customRenderer = fieldRenderers[field];
    if (customRenderer) {
      return customRenderer({
        field,
        value,
        onChange: (newValue) => handleFieldChange(field, newValue),
        readOnly,
        error: error ?? undefined,
        label,
      });
    }

    // Default field rendering
    switch (field) {
      case 'category':
      case 'author':
      case 'version':
      case 'slug':
      case 'prevArticle':
      case 'nextArticle':
        return (
          <TextInput
            key={field}
            id={`metadata-${field}`}
            label={label}
            value={(value as string) ?? ''}
            onChange={(v) => handleFieldChange(field, v)}
            readOnly={readOnly}
            error={error}
          />
        );

      case 'order':
        return (
          <NumberInput
            key={field}
            id={`metadata-${field}`}
            label={label}
            value={value as number | undefined}
            onChange={(v) => handleFieldChange(field, v)}
            readOnly={readOnly}
            error={error}
          />
        );

      case 'tags':
        return (
          <TagsInput
            key={field}
            id={`metadata-${field}`}
            label={label}
            value={(value as string[]) ?? []}
            onChange={(v) => handleFieldChange(field, v)}
            readOnly={readOnly}
            placeholder={labels.tagsPlaceholder}
            error={error}
          />
        );

      case 'relatedArticles':
        return (
          <TagsInput
            key={field}
            id={`metadata-${field}`}
            label={label}
            value={(value as string[]) ?? []}
            onChange={(v) => handleFieldChange(field, v)}
            readOnly={readOnly}
            placeholder={labels.relatedPlaceholder}
            error={error}
          />
        );

      case 'published':
        return (
          <CheckboxInput
            key={field}
            id={`metadata-${field}`}
            label={label}
            checked={(value as boolean) ?? true}
            onChange={(v) => handleFieldChange(field, v)}
            readOnly={readOnly}
          />
        );

      case 'createdAt':
      case 'updatedAt':
        return (
          <DateInput
            key={field}
            id={`metadata-${field}`}
            label={label}
            value={(value as string) ?? ''}
            onChange={(v) => handleFieldChange(field, v)}
            readOnly={readOnly}
            error={error}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`help-metadata-editor ${className ?? ''}`}
      data-readonly={readOnly}
    >
      {fields.map(renderField)}
    </div>
  );
};

// Input component helpers

interface InputProps {
  id: string;
  label: string;
  readOnly: boolean;
  error?: string | null;
}

interface TextInputProps extends InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  id,
  label,
  value,
  onChange,
  readOnly,
  error,
  placeholder,
}) => (
  <div className='help-metadata-field' data-error={!!error}>
    <label htmlFor={id} className='help-metadata-label'>
      {label}
    </label>
    <input
      id={id}
      type='text'
      className='help-metadata-input'
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={readOnly}
      placeholder={placeholder}
    />
    {error && <span className='help-metadata-error'>{error}</span>}
  </div>
);

interface NumberInputProps extends InputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({
  id,
  label,
  value,
  onChange,
  readOnly,
  error,
}) => (
  <div className='help-metadata-field' data-error={!!error}>
    <label htmlFor={id} className='help-metadata-label'>
      {label}
    </label>
    <input
      id={id}
      type='number'
      className='help-metadata-input'
      value={value ?? ''}
      onChange={(e) =>
        onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
      }
      disabled={readOnly}
    />
    {error && <span className='help-metadata-error'>{error}</span>}
  </div>
);

interface TagsInputProps extends InputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

const TagsInput: React.FC<TagsInputProps> = ({
  id,
  label,
  value,
  onChange,
  readOnly,
  error,
  placeholder,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onChange(tags);
  };

  return (
    <div className='help-metadata-field' data-error={!!error}>
      <label htmlFor={id} className='help-metadata-label'>
        {label}
      </label>
      <input
        id={id}
        type='text'
        className='help-metadata-input'
        value={value.join(', ')}
        onChange={handleChange}
        disabled={readOnly}
        placeholder={placeholder}
      />
      {error && <span className='help-metadata-error'>{error}</span>}
    </div>
  );
};

interface CheckboxInputProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  readOnly: boolean;
}

const CheckboxInput: React.FC<CheckboxInputProps> = ({
  id,
  label,
  checked,
  onChange,
  readOnly,
}) => (
  <div className='help-metadata-field help-metadata-field-checkbox'>
    <label htmlFor={id} className='help-metadata-label'>
      <input
        id={id}
        type='checkbox'
        className='help-metadata-checkbox'
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={readOnly}
      />
      {label}
    </label>
  </div>
);

interface DateInputProps extends InputProps {
  value: string;
  onChange: (value: string) => void;
}

const DateInput: React.FC<DateInputProps> = ({
  id,
  label,
  value,
  onChange,
  readOnly,
  error,
}) => {
  // Convert ISO string to date input format
  const dateValue = value ? value.split('T')[0] : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    onChange(newDate ? new Date(newDate).toISOString() : '');
  };

  return (
    <div className='help-metadata-field' data-error={!!error}>
      <label htmlFor={id} className='help-metadata-label'>
        {label}
      </label>
      <input
        id={id}
        type='date'
        className='help-metadata-input'
        value={dateValue}
        onChange={handleChange}
        disabled={readOnly}
      />
      {error && <span className='help-metadata-error'>{error}</span>}
    </div>
  );
};

// Export all fields for reference
export { allFields, defaultFields };

export default HelpMetadataEditor;

/**
 * Asset Upload Component for the Web Help Component Library
 * @module @privify-pw/web-help/components/editor/HelpAssetUpload
 * 
 * A headless asset upload component that provides file selection,
 * upload handling, and asset management through callbacks.
 */

import React, { useState, useCallback, useRef } from 'react';

/**
 * Props for the HelpAssetUpload component.
 */
export interface HelpAssetUploadProps {
  /** Called when files are selected for upload */
  onUpload: (files: File[]) => Promise<UploadResult[]>;
  /** Called when an asset is deleted */
  onDelete?: (assetId: string) => Promise<void>;
  /** Existing assets to display */
  assets?: Asset[];
  /** Called when an asset is selected/inserted */
  onSelect?: (asset: Asset) => void;
  /** Accepted file types (e.g., 'image/*', '.pdf') */
  accept?: string;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** Whether multiple files can be selected */
  multiple?: boolean;
  /** Labels for internationalization */
  labels?: HelpAssetUploadLabels;
  /** Whether uploads are disabled */
  disabled?: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Asset type.
 */
export interface Asset {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Asset URL */
  url: string;
  /** Asset type */
  type: 'image' | 'document' | 'video' | 'audio' | 'other';
  /** File size in bytes */
  size?: number;
  /** MIME type */
  mimeType?: string;
  /** Thumbnail URL (for images/videos) */
  thumbnail?: string;
  /** Upload date */
  uploadedAt?: string;
}

/**
 * Upload result.
 */
export interface UploadResult {
  /** Success status */
  success: boolean;
  /** Uploaded asset (on success) */
  asset?: Asset;
  /** Error message (on failure) */
  error?: string;
  /** Original file */
  file: File;
}

/**
 * Labels for internationalization.
 */
export interface HelpAssetUploadLabels {
  dropzone?: string;
  dropzoneActive?: string;
  browse?: string;
  uploading?: string;
  uploadFailed?: string;
  deleteConfirm?: string;
  fileTooLarge?: string;
  tooManyFiles?: string;
  invalidType?: string;
  noAssets?: string;
}

/**
 * Default labels.
 */
const defaultLabels: Required<HelpAssetUploadLabels> = {
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
};

/**
 * HelpAssetUpload component - A headless asset upload and management component.
 */
export const HelpAssetUpload: React.FC<HelpAssetUploadProps> = ({
  onUpload,
  onDelete,
  assets = [],
  onSelect,
  accept = '*/*',
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  multiple = true,
  labels: customLabels,
  disabled = false,
  className,
}) => {
  const labels = { ...defaultLabels, ...customLabels };

  // State
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // Validate files
  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const valid: File[] = [];
      const errors: string[] = [];

      if (files.length > maxFiles) {
        errors.push(labels.tooManyFiles);
        return { valid: [], errors };
      }

      for (const file of files) {
        // Check file size
        if (file.size > maxFileSize) {
          errors.push(`${file.name}: ${labels.fileTooLarge}`);
          continue;
        }

        // Check file type
        if (accept !== '*/*') {
          const acceptedTypes = accept.split(',').map((t) => t.trim());
          const isValid = acceptedTypes.some((type) => {
            if (type.startsWith('.')) {
              return file.name.toLowerCase().endsWith(type);
            }
            if (type.endsWith('/*')) {
              return file.type.startsWith(type.slice(0, -1));
            }
            return file.type === type;
          });

          if (!isValid) {
            errors.push(`${file.name}: ${labels.invalidType}`);
            continue;
          }
        }

        valid.push(file);
      }

      return { valid, errors };
    },
    [accept, maxFileSize, maxFiles, labels]
  );

  // Handle file selection
  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (disabled) return;

      const files = Array.from(fileList);
      const { valid, errors } = validateFiles(files);

      setUploadErrors(errors);

      if (valid.length === 0) return;

      setIsUploading(true);

      // Initialize progress
      const progress = new Map<string, number>();
      valid.forEach((file) => progress.set(file.name, 0));
      setUploadProgress(progress);

      try {
        const results = await onUpload(valid);

        // Check for upload errors
        const uploadErrs = results
          .filter((r) => !r.success)
          .map((r) => `${r.file.name}: ${r.error ?? labels.uploadFailed}`);

        setUploadErrors((prev) => [...prev, ...uploadErrs]);
      } catch (err) {
        setUploadErrors((prev) => [
          ...prev,
          err instanceof Error ? err.message : labels.uploadFailed,
        ]);
      } finally {
        setIsUploading(false);
        setUploadProgress(new Map());
      }
    },
    [disabled, validateFiles, onUpload, labels]
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragActive(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (!disabled && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, handleFiles]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  // Handle click to browse
  const handleBrowseClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  // Handle asset delete
  const handleDelete = useCallback(
    async (assetId: string) => {
      if (!onDelete) return;

      if (!window.confirm(labels.deleteConfirm)) return;

      try {
        await onDelete(assetId);
      } catch (err) {
        setUploadErrors([err instanceof Error ? err.message : 'Delete failed']);
      }
    },
    [onDelete, labels.deleteConfirm]
  );

  // Handle asset select
  const handleAssetClick = useCallback(
    (asset: Asset) => {
      onSelect?.(asset);
    },
    [onSelect]
  );

  // Get file type icon/indicator
  const getAssetTypeClass = (type: Asset['type']): string => {
    return `help-asset-type-${type}`;
  };

  return (
    <div
      className={`help-asset-upload ${className ?? ''}`}
      data-disabled={disabled}
      data-uploading={isUploading}
    >
      {/* Dropzone */}
      <div
        className={`help-asset-dropzone ${isDragActive ? 'help-asset-dropzone-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBrowseClick();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="help-asset-input"
          aria-hidden="true"
        />

        {isUploading ? (
          <div className="help-asset-uploading">
            <span className="help-asset-uploading-text">{labels.uploading}</span>
            {uploadProgress.size > 0 && (
              <div className="help-asset-progress">
                {Array.from(uploadProgress.entries()).map(([name, progress]) => (
                  <div key={name} className="help-asset-progress-item">
                    <span className="help-asset-progress-name">{name}</span>
                    <span className="help-asset-progress-value">{progress}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="help-asset-dropzone-content">
            <span className="help-asset-dropzone-text">
              {isDragActive ? labels.dropzoneActive : labels.dropzone}
            </span>
            <button
              type="button"
              className="help-asset-browse-button"
              disabled={disabled}
            >
              {labels.browse}
            </button>
          </div>
        )}
      </div>

      {/* Errors */}
      {uploadErrors.length > 0 && (
        <div className="help-asset-errors">
          {uploadErrors.map((error, index) => (
            <div key={index} className="help-asset-error">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Asset list */}
      <div className="help-asset-list">
        {assets.length === 0 ? (
          <div className="help-asset-empty">{labels.noAssets}</div>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.id}
              className={`help-asset-item ${getAssetTypeClass(asset.type)}`}
              onClick={() => handleAssetClick(asset)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleAssetClick(asset);
                }
              }}
            >
              {/* Thumbnail */}
              {asset.thumbnail || asset.type === 'image' ? (
                <img
                  src={asset.thumbnail ?? asset.url}
                  alt={asset.name}
                  className="help-asset-thumbnail"
                />
              ) : (
                <div className="help-asset-icon" data-type={asset.type}>
                  {asset.type.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="help-asset-info">
                <span className="help-asset-name">{asset.name}</span>
                {asset.size && (
                  <span className="help-asset-size">{formatFileSize(asset.size)}</span>
                )}
              </div>

              {/* Actions */}
              {onDelete && (
                <button
                  type="button"
                  className="help-asset-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(asset.id);
                  }}
                  aria-label={`Delete ${asset.name}`}
                >
                  ×
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Format file size for display.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Helper to determine asset type from MIME type.
 */
export function getAssetTypeFromMime(mimeType: string): Asset['type'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  ) {
    return 'document';
  }
  return 'other';
}

export default HelpAssetUpload;

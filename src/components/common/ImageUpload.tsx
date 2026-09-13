import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Link as LinkIcon } from 'lucide-react';
import { adminService } from '../../services/adminServices';
import { resolveImageUrl } from '../../utils/image';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  helperText?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'general',
  label = 'Image',
  helperText = 'Supports PNG, JPG, WEBP or SVG up to 5MB',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setUploadError(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file format. Please upload a JPG, PNG, WEBP, SVG, or GIF.');
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File is too large. Maximum allowed size is 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      const response = await adminService.uploadImage(file, folder);
      const uploadedUrl = response?.data?.url || response?.url;
      if (uploadedUrl) {
        onChange(uploadedUrl);
      } else {
        throw new Error('Upload succeeded but no image URL was returned.');
      }
    } catch (err: any) {
      setUploadError(
        err.response?.data?.message || err.message || 'Failed to upload image. Please try again.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-text">{label}</label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
        >
          <LinkIcon className="w-3 h-3" />
          {showUrlInput ? 'Switch to file upload' : 'Or enter image URL'}
        </button>
      </div>

      {uploadError && (
        <div className="p-2.5 bg-error/10 text-error rounded-md text-xs border border-error/20 flex items-center justify-between">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-error/70 hover:text-error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showUrlInput ? (
        <div className="space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/image.png"
            className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-surface"
          />
          {value && (
            <div className="flex items-center gap-3 p-2 bg-background rounded-lg border border-border">
              <img
                src={resolveImageUrl(value)}
                alt="Preview"
                className="w-12 h-12 rounded object-cover border border-border"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-xs text-secondary truncate flex-1">{value}</span>
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-xs text-error hover:text-error/80 px-2 py-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/gif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {value ? (
            <div className="relative group border border-border rounded-xl p-3 bg-background flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-surface border border-border shrink-0 flex items-center justify-center">
                <img
                  src={resolveImageUrl(value)}
                  alt="Uploaded preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <ImageIcon className="w-6 h-6 text-secondary absolute -z-10" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">Image uploaded</p>
                <p className="text-xs text-secondary truncate">{value}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium bg-surface text-text hover:bg-background border border-border rounded-md transition-colors"
                >
                  Change
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => onChange('')}
                  className="p-1.5 text-secondary hover:text-error hover:bg-error/10 rounded-md transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[0.99]'
                  : 'border-border hover:border-primary/50 hover:bg-background/60 bg-surface'
              } ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm font-medium text-text">Uploading image...</p>
                  <p className="text-xs text-secondary">Optimizing and storing...</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-text">
                      <span className="text-primary hover:underline">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-secondary">{helperText}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

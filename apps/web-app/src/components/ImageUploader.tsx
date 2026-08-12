import React, { useState, useRef } from "react";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import { uploadMultipleImagesDirect } from "../services/image-upload.service";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxFiles?: number;
  maxSizeBytes?: number;
  folder?: string;
}

export default function ImageUploader({
  images,
  onChange,
  maxFiles = 10,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB
  folder = "products",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setError(null);

    // Validate maximum file count limit
    if (images.length + selectedFiles.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} images in total.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate size limit (capped on client side before upload)
    const overSizedFile = selectedFiles.find((f) => f.size > maxSizeBytes);
    if (overSizedFile) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      setError(`File "${overSizedFile.name}" exceeds maximum limit of ${maxMb}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate MIME types
    const invalidTypeFile = selectedFiles.find(
      (f) => !["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"].includes(f.type)
    );
    if (invalidTypeFile) {
      setError(`File "${invalidTypeFile.name}" is not a supported image format.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      // Direct upload from browser to Cloudinary via signed request
      const results = await uploadMultipleImagesDirect(selectedFiles, folder);
      const newUrls = results.map((r) => r.secure_url);
      onChange([...images, ...newUrls]);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || "Failed to upload images directly";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Upload Zone */}
      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[110px] ${
          isUploading
            ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 cursor-not-allowed"
            : "border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Loader2 className="w-7 h-7 animate-spin" />
            <span className="text-xs font-semibold">Uploading directly to Cloudinary...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full mb-0.5">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Click or drag images here to upload
            </p>
            <p className="text-[11px] text-slate-400">
              Direct Cloudinary Upload • Max {maxFiles} images • Max {(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB each
            </p>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200 dark:border-rose-900/50">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploaded Images Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2.5 pt-1">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <img
                src={url}
                alt={`Uploaded product ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Folder
} from 'lucide-react';
import { uploadFile, formatBytes, MAX_FILE_SIZE_BYTES } from '@/lib/files';

export default function UploadModal({
  isOpen,
  onClose,
  folderId = null,
  folderName = 'My Files',
  onUploadComplete,
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelection = (fileList) => {
    setGlobalError('');
    const newFiles = Array.from(fileList).map((f) => {
      const isOversized = f.size > MAX_FILE_SIZE_BYTES;
      return {
        raw: f,
        name: f.name,
        size: f.size,
        progress: 0,
        status: isOversized ? 'error' : 'idle',
        error: isOversized ? 'Exceeds 50MB limit' : '',
      };
    });

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  const removeFileFromQueue = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startUpload = async () => {
    const validFiles = selectedFiles.filter(
      (f) => f.status === 'idle' || f.status === 'error'
    );
    if (validFiles.length === 0) {
      setGlobalError('No valid files in queue to upload.');
      return;
    }

    setUploading(true);
    setGlobalError('');

    let anySuccess = false;

    for (let i = 0; i < selectedFiles.length; i++) {
      const item = selectedFiles[i];
      if (item.status === 'complete' || item.error === 'Exceeds 50MB limit') {
        continue;
      }

      // Mark file as uploading
      setSelectedFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading', progress: 10 } : f))
      );

      try {
        await uploadFile(item.raw, folderId, (progress) => {
          setSelectedFiles((prev) =>
            prev.map((f, idx) => (idx === i ? { ...f, progress } : f))
          );
        });

        setSelectedFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'complete', progress: 100 } : f
          )
        );
        anySuccess = true;
      } catch (err) {
        setSelectedFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: 'error', error: err.message || 'Upload failed' }
              : f
          )
        );
      }
    }

    setUploading(false);
    if (anySuccess) {
      onUploadComplete?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Files</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span>Destination:</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Folder className="w-3 h-3 text-amber-500" />
                  {folderName}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {globalError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{globalError}</span>
          </div>
        )}

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/60 bg-slate-50/30'
          }`}
        >
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileSelection(e.target.files)}
            className="hidden"
          />
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-800">
            Click to browse or drag and drop files here
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Supports PDF, images, video, docs, audio & ZIP up to 50MB per file
          </p>
        </div>

        {/* Selected Files Queue */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
              <span>Queue ({selectedFiles.length} files)</span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                disabled={uploading}
                className="text-[11px] text-blue-600 hover:text-blue-800 disabled:opacity-50 cursor-pointer"
              >
                Clear all
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 p-1 border border-slate-100 rounded-xl">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <File className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 truncate">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>{formatBytes(file.size)}</span>
                        {file.error && (
                          <span className="text-red-500 font-medium">
                            • {file.error}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      {file.status === 'uploading' && (
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="bg-blue-600 h-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {file.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    )}
                    {file.status === 'complete' && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    {!uploading && (
                      <button
                        type="button"
                        onClick={() => removeFileFromQueue(idx)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
          >
            {selectedFiles.some((f) => f.status === 'complete') ? 'Done' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={startUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition cursor-pointer disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

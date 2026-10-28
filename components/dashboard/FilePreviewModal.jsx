'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Download,
  Loader2,
  File,
  AlertCircle,
  ExternalLink,
  Share2
} from 'lucide-react';
import { getFileSignedUrl, downloadFile, formatBytes } from '@/lib/files';
import { getFileTypeIcon } from './FileItem';
import ShareCodeModal from './ShareCodeModal';

export default function FilePreviewModal({ isOpen, onClose, file }) {
  const [signedUrl, setSignedUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareCodeOpen, setShareCodeOpen] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      setLoading(true);
      setError('');
      setSignedUrl('');
      setTextContent('');

      getFileSignedUrl(file.storage_path)
        .then(async (url) => {
          setSignedUrl(url);

          // If text or plain code file, fetch content to display
          const ext = file.name.split('.').pop()?.toLowerCase();
          const isText =
            file.mime_type.startsWith('text/') ||
            ['txt', 'md', 'json', 'csv', 'js', 'html', 'css'].includes(ext);

          if (isText && url) {
            try {
              const res = await fetch(url);
              if (res.ok) {
                const text = await res.text();
                setTextContent(text);
              }
            } catch {
              // Ignore text fetch error, fallback to preview
            }
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to generate preview URL.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const ext = file.name.split('.').pop()?.toLowerCase();
  const isImage =
    file.mime_type.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext);
  const isPdf = file.mime_type.includes('pdf') || ext === 'pdf';
  const isVideo =
    file.mime_type.startsWith('video/') ||
    ['mp4', 'mov', 'webm', 'mkv'].includes(ext);
  const isAudio =
    file.mime_type.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'm4a'].includes(ext);
  const isText = Boolean(textContent);

  const { icon: FileIcon, color, bg } = getFileTypeIcon(file.mime_type, file.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
              <FileIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {file.name}
              </h3>
              <p className="text-xs text-slate-500">
                {formatBytes(file.size_bytes)} • {file.mime_type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShareCodeOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Share Code</span>
            </button>

            <button
              onClick={() => downloadFile(file)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-50/50 min-h-[350px]">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs">Loading preview...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : isImage ? (
            <div className="max-h-[65vh] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={file.name}
                className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-md"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={signedUrl}
              title={file.name}
              className="w-full h-[65vh] rounded-xl border border-slate-200 bg-white"
            />
          ) : isVideo ? (
            <video
              src={signedUrl}
              controls
              className="max-h-[60vh] max-w-full rounded-xl shadow-md"
            />
          ) : isAudio ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileIcon className="w-8 h-8" />
              </div>
              <audio src={signedUrl} controls className="w-72" />
            </div>
          ) : isText ? (
            <div className="w-full max-h-[65vh] overflow-auto bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs leading-relaxed">
              <pre className="whitespace-pre-wrap">{textContent}</pre>
            </div>
          ) : (
            <div className="p-12 text-center space-y-4 max-w-sm mx-auto">
              <div className={`w-20 h-20 rounded-3xl ${bg} ${color} flex items-center justify-center mx-auto shadow-2xs`}>
                <FileIcon className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  No preview available
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Browser previews are not supported for this file type ({ext?.toUpperCase() || 'Binary'}). You can safely download it to view on your device.
                </p>
              </div>
              <button
                onClick={() => downloadFile(file)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download {file.name}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ShareCodeModal
        isOpen={shareCodeOpen}
        onClose={() => setShareCodeOpen(false)}
        file={file}
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Clock,
  KeyRound,
  File,
  ExternalLink,
  ShieldCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { shareCloudFile } from '@/lib/share';
import { formatBytes } from '@/lib/files';
import { getFileTypeIcon } from './FileItem';

export default function ShareCodeModal({ isOpen, onClose, file }) {
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      setLoading(true);
      setError('');
      setShareData(null);
      setCopiedCode(false);
      setCopiedLink(false);

      shareCloudFile(file, 60)
        .then((res) => {
          setShareData(res);
        })
        .catch((err) => {
          setError(err.message || 'Failed to generate share code.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const { icon: FileIcon, color, bg } = getFileTypeIcon(file.mime_type, file.name);

  const shareUrl = shareData
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/clipboard?code=${encodeURIComponent(
        shareData.share_code
      )}`
    : '';

  const handleCopyCode = async () => {
    if (!shareData?.share_code) return;
    try {
      await navigator.clipboard.writeText(shareData.share_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Share via Quick Code
              </h3>
              <p className="text-xs text-slate-500">
                Anyone can download without signing in
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File summary card */}
        <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
            <FileIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {file.name}
            </p>
            <p className="text-[11px] text-slate-500">
              {formatBytes(file.size_bytes)}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center space-y-2">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500">Generating 6-digit share code...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : shareData ? (
          <div className="space-y-4">
            {/* Share Code Box */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
              <span className="text-[11px] uppercase tracking-wider text-blue-700 font-semibold block mb-1">
                6-Digit Download Code
              </span>
              <div className="text-3xl font-extrabold tracking-widest font-mono text-blue-700">
                {shareData.share_code}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <Clock className="w-3 h-3 animate-pulse" />
                <span>Expires in 60 minutes</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Instruction footnote */}
            <p className="text-[11px] text-slate-500 leading-relaxed text-center">
              Recipients can go to <span className="font-semibold text-slate-700">/clipboard</span> on any device, enter this code, and download your file directly without logging in.
            </p>
          </div>
        ) : null}

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

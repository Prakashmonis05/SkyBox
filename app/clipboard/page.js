'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Cloud,
  Share2,
  Copy,
  Check,
  Download,
  Clock,
  KeyRound,
  FileText,
  FileCode,
  File,
  Upload,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Shield,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  createPublicClip,
  getSharedClipByCode,
  generateShareCode,
} from '@/lib/share';
import { formatBytes } from '@/lib/files';

function PublicClipboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCode = searchParams.get('code') || '';

  const [activeTab, setActiveTab] = useState(queryCode ? 'receive' : 'share');
  const [shareType, setShareType] = useState('text'); // 'text' | 'file'

  // Share form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [generatedClip, setGeneratedClip] = useState(null);

  // Receive form states
  const [inputCode, setInputCode] = useState(queryCode);
  const [retrieving, setRetrieving] = useState(false);
  const [retrievedClip, setRetrievedClip] = useState(null);
  const [retrieveError, setRetrieveError] = useState('');

  // UI helpers
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(3600);

  const fileInputRef = useRef(null);

  // If code is in URL query parameter, automatically retrieve it
  useEffect(() => {
    if (queryCode) {
      setInputCode(queryCode);
      setActiveTab('receive');
      handleRetrieveClip(queryCode);
    }
  }, [queryCode]);

  // Live countdown timer for active clip
  useEffect(() => {
    const activeClip = generatedClip || retrievedClip;
    if (!activeClip?.expires_at) return;

    const updateTimer = () => {
      const diffMs = new Date(activeClip.expires_at).getTime() - Date.now();
      if (diffMs <= 0) {
        setSecondsLeft(0);
      } else {
        setSecondsLeft(Math.floor(diffMs / 1000));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [generatedClip, retrievedClip]);

  const handleCreateShare = async (e) => {
    e.preventDefault();
    if (shareType === 'text' && !content.trim()) return;
    if (shareType === 'file' && !selectedFile) return;

    setCreating(true);
    try {
      let clipTitle = title.trim();
      let clipContent = content;
      let fileName = 'snippet.txt';
      let fileSize = 0;
      let mimeType = 'text/plain';

      if (shareType === 'file' && selectedFile) {
        clipTitle = clipTitle || selectedFile.name;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
        mimeType = selectedFile.type || 'application/octet-stream';

        // Read text content if plain text/code for quick preview
        if (selectedFile.type.startsWith('text/') || selectedFile.size < 100000) {
          try {
            clipContent = await selectedFile.text();
          } catch {
            clipContent = `[Binary file: ${selectedFile.name}]`;
          }
        } else {
          clipContent = `[Uploaded File: ${selectedFile.name}]`;
        }
      } else {
        clipTitle = clipTitle || content.trim().split('\n')[0].slice(0, 30) || 'Untitled Snippet';
        fileSize = new Blob([clipContent]).size;
      }

      const created = await createPublicClip({
        title: clipTitle,
        content: clipContent,
        fileName,
        fileSize,
        mimeType,
        minutes: 60,
      });

      setGeneratedClip(created);
      setTitle('');
      setContent('');
      setSelectedFile(null);
    } catch (err) {
      console.error('Error creating public clip:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleRetrieveClip = async (codeToSearch = inputCode) => {
    if (!codeToSearch || !codeToSearch.trim()) return;

    setRetrieving(true);
    setRetrieveError('');
    setRetrievedClip(null);

    try {
      const clip = await getSharedClipByCode(codeToSearch);
      if (!clip) {
        setRetrieveError('No active content found for code "' + codeToSearch.toUpperCase() + '". It may have expired (60-minute limit) or does not exist.');
      } else {
        setRetrievedClip(clip);
      }
    } catch (err) {
      setRetrieveError('Unable to fetch clip. Please verify the code.');
    } finally {
      setRetrieving(false);
    }
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleCopyLink = async (code) => {
    try {
      const url = `${window.location.origin}/clipboard?code=${encodeURIComponent(code)}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleCopyContent = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    } catch {}
  };

  const handleDownload = async (clip) => {
    if (!clip) return;
    setDownloading(true);

    try {
      // If server API route is available
      const apiDownloadUrl = `/api/share/${encodeURIComponent(clip.share_code)}/download`;

      // Check if it's text or cloud file
      if (clip.is_cloud_file) {
        window.location.href = apiDownloadUrl;
      } else {
        // Direct browser download of content
        const blob = new Blob([clip.content || ''], {
          type: clip.mime_type || 'text/plain;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = clip.file_name || `${clip.title || 'snippet'}.txt`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  const formatCountdown = (totalSecs) => {
    if (totalSecs <= 0) return 'Expired';
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                Sky<span className="text-blue-600">Box</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-0.5">
                Online Clipboard
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-xl transition"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-xs transition"
            >
              <span>Cloud Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Instant Share • No Sign-In Required • 60-Minute Expiration</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Public Online Clipboard & Quick Share
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Drop text, code, or links to get a short 6-digit code. Anyone can use the code to view or download it on any device.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('share')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                activeTab === 'share'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Share Content</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('receive')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
                activeTab === 'receive'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Receive via Code</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Share Content */}
        {activeTab === 'share' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            {generatedClip ? (
              /* Success / Share Code Modal Banner */
              <div className="text-center py-4 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Content is Live & Ready to Share!
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Give this 6-digit code to anyone or share the direct link.
                  </p>
                </div>

                {/* Big Share Code Display */}
                <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-blue-200 flex flex-col items-center gap-3">
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                    Your 6-Digit Share Code
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-wider font-mono text-blue-600">
                    {generatedClip.share_code}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>Expires in {formatCountdown(secondsLeft)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(generatedClip.share_code)}
                    className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(generatedClip.share_code)}
                    className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <ExternalLink className="w-4 h-4 text-slate-500" />}
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(generatedClip)}
                    disabled={downloading}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Download className="w-4 h-4 text-blue-600" />}
                    <span>Download Shared File ({generatedClip.file_name})</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setGeneratedClip(null)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    + Share Another Clip
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateShare} className="space-y-5">
                {/* Mode selector */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Sharing Mode:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShareType('text')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        shareType === 'text'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Text / Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareType('file')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        shareType === 'file'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label
                    htmlFor="clip-title"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Title (Optional)
                  </label>
                  <input
                    id="clip-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. WiFi Passwords, Project Snippet, Notes..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 hover:bg-white focus:bg-white transition"
                  />
                </div>

                {/* Text Content Input */}
                {shareType === 'text' ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="clip-content"
                        className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                      >
                        Content / Code Snippet
                      </label>
                      <span className="text-xs text-slate-400 font-mono">
                        {content.length} chars
                      </span>
                    </div>
                    <textarea
                      id="clip-content"
                      rows={8}
                      required
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Paste your text, code, secret notes, or URLs here..."
                      className="w-full rounded-xl border border-slate-200 p-3.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 hover:bg-white focus:bg-white transition leading-relaxed resize-y"
                    />
                  </div>
                ) : (
                  /* File Upload Input */
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                      Choose File to Share
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20 rounded-2xl p-6 text-center cursor-pointer transition"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      {selectedFile ? (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                            <File className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-bold text-slate-800">
                            {selectedFile.name}
                          </span>
                          <span className="text-xs text-slate-500 mt-0.5">
                            {formatBytes(selectedFile.size)}
                          </span>
                          <span className="text-xs text-blue-600 font-semibold mt-2 underline">
                            Change file
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                            <Upload className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">
                            Click to select a file from your device
                          </span>
                          <span className="text-xs text-slate-500 mt-1">
                            Documents, code, images, zip files, or text
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Expiration Note */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-800">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Automatic 60-Minute Expiration:</span>{' '}
                    Your shared snippet will automatically self-destruct after 60 minutes for security and privacy.
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={creating || (shareType === 'text' && !content.trim()) || (shareType === 'file' && !selectedFile)}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Share Code...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Generate 6-Digit Share Code</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Receive via Code */}
        {activeTab === 'receive' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Input Search Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRetrieveClip();
              }}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="receive-code"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Enter 6-Digit Share Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="receive-code"
                      type="text"
                      maxLength={10}
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SKY-4921"
                      className="w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-3 text-base font-mono font-bold tracking-wider uppercase text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 hover:bg-white focus:bg-white transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={retrieving || !inputCode.trim()}
                    className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {retrieving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Retrieve</span>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {retrieveError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span>{retrieveError}</span>
              </div>
            )}

            {/* Retrieved Content Display */}
            {retrievedClip && (
              <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-in fade-in">
                {/* Header Info */}
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">
                        {retrievedClip.title || retrievedClip.file_name}
                      </h3>
                      {retrievedClip.is_cloud_file && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
                          Cloud Vault File
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                      <span>Code: {retrievedClip.share_code}</span>
                      <span>•</span>
                      <span>{formatBytes(retrievedClip.file_size)}</span>
                      {retrievedClip.download_count > 0 && (
                        <>
                          <span>•</span>
                          <span>{retrievedClip.download_count} downloads</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expiration badge */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    <span>Expires in {formatCountdown(secondsLeft)}</span>
                  </div>
                </div>

                {/* Content Viewer */}
                <div className="p-5 bg-white">
                  {retrievedClip.content ? (
                    <div className="relative">
                      <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto max-h-96 whitespace-pre-wrap select-all">
                        {retrievedClip.content}
                      </pre>
                    </div>
                  ) : (
                    /* Binary / Cloud file preview card */
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                        <File className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {retrievedClip.file_name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Ready to download ({formatBytes(retrievedClip.file_size)})
                      </p>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownload(retrievedClip)}
                      disabled={downloading}
                      className="flex-1 min-w-[160px] py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {downloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Download File ({retrievedClip.file_name})</span>
                    </button>

                    {retrievedClip.content && (
                      <button
                        type="button"
                        onClick={() => handleCopyContent(retrievedClip.content)}
                        className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition flex items-center gap-2 cursor-pointer"
                      >
                        {copiedContent ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-500" />
                        )}
                        <span>{copiedContent ? 'Copied Content!' : 'Copy Text'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setRetrievedClip(null);
                        setInputCode('');
                      }}
                      className="py-2.5 px-3 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer note */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-200/60 bg-white">
        <p>
          SkyBox Online Clipboard • Temporary, encrypted, zero-login sharing • Automatic 60-minute cleanup
        </p>
      </footer>
    </div>
  );
}

export default function PublicClipboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <PublicClipboardContent />
    </Suspense>
  );
}

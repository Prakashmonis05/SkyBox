'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Share2,
  Copy,
  Check,
  Download,
  Clock,
  KeyRound,
  FileText,
  File,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Cloud,
  X,
  Search,
  LogIn,
} from 'lucide-react';
import {
  createPublicClip,
  getSharedClipByCode,
  shareCloudFile,
} from '@/lib/share';
import { formatBytes, getAllUserFiles } from '@/lib/files';
import { createClient } from '@/lib/supabase/client';

export default function OnlineClipboard({
  initialCode = '',
  initialFileId = '',
  initialTab = 'share',
  compact = false,
  showCloudVault = false,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState(initialCode ? 'receive' : initialTab);
  const [shareType, setShareType] = useState('text'); // 'text' | 'file'

  // Share form states (Title field removed as requested)
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // Local device file
  const [selectedCloudFile, setSelectedCloudFile] = useState(null); // Cloud vault file
  const [creating, setCreating] = useState(false);
  const [generatedClip, setGeneratedClip] = useState(null);

  // Cloud file picker modal states
  const [cloudPickerOpen, setCloudPickerOpen] = useState(false);
  const [cloudFiles, setCloudFiles] = useState([]);
  const [cloudFilesLoading, setCloudFilesLoading] = useState(false);
  const [cloudSearchTerm, setCloudSearchTerm] = useState('');
  const [notLoggedInPrompt, setNotLoggedInPrompt] = useState(false);

  // Receive form states
  const [inputCode, setInputCode] = useState(initialCode);
  const [retrieving, setRetrieving] = useState(false);
  const [retrievedClip, setRetrievedClip] = useState(null);
  const [retrieveError, setRetrieveError] = useState('');

  // Helpers state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(86400); // 24 hours in seconds

  const fileInputRef = useRef(null);

  // If initialCode changes or if query param ?code= is present in URL, trigger retrieval
  useEffect(() => {
    if (initialCode) {
      setInputCode(initialCode);
      setActiveTab('receive');
      handleRetrieveClip(initialCode);
    } else if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('code');
      if (codeFromUrl) {
        setInputCode(codeFromUrl);
        setActiveTab('receive');
        handleRetrieveClip(codeFromUrl);
      }
    }
  }, [initialCode]);

  // If initialFileId is provided (e.g. from clicking "Share via Code" on any file page), auto-share it
  useEffect(() => {
    if (!initialFileId) return;

    let isMounted = true;
    async function loadAndAutoShare() {
      setCreating(true);
      setActiveTab('share');
      setShareType('file');

      try {
        const supabase = createClient();
        const { data: file, error } = await supabase
          .from('files')
          .select('*')
          .eq('id', initialFileId)
          .single();

        if (error || !file) {
          console.warn('Could not find file by ID:', initialFileId);
          setCreating(false);
          return;
        }

        if (!isMounted) return;
        setSelectedCloudFile(file);

        // Immediately generate public share code (24 hours)
        const clip = await shareCloudFile(file, 1440);
        if (isMounted) {
          setGeneratedClip(clip);
        }
      } catch (err) {
        console.error('Failed to auto-share file:', err);
      } finally {
        if (isMounted) setCreating(false);
      }
    }

    loadAndAutoShare();
    return () => {
      isMounted = false;
    };
  }, [initialFileId]);

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

  // Open Cloud File Picker Modal
  const handleOpenCloudPicker = async () => {
    setNotLoggedInPrompt(false);
    setCloudPickerOpen(true);
    setCloudFilesLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setNotLoggedInPrompt(true);
        setCloudFilesLoading(false);
        return;
      }

      const files = await getAllUserFiles();
      setCloudFiles(files || []);
    } catch (err) {
      console.error('Error fetching cloud files:', err);
      setCloudFiles([]);
    } finally {
      setCloudFilesLoading(false);
    }
  };

  const handleSelectCloudFile = (file) => {
    setSelectedCloudFile(file);
    setSelectedFile(null);
    setShareType('file');
    setCloudPickerOpen(false);
  };

  const handleCreateShare = async (e) => {
    e.preventDefault();
    if (shareType === 'text' && !content.trim()) return;
    if (shareType === 'file' && !selectedFile && !selectedCloudFile) return;

    setCreating(true);
    try {
      if (shareType === 'file' && selectedCloudFile) {
        // Sharing existing cloud file (24 hours)
        const created = await shareCloudFile(selectedCloudFile, 1440);
        setGeneratedClip(created);
        setSelectedCloudFile(null);
        setSelectedFile(null);
      } else if (shareType === 'file' && selectedFile) {
        // Sharing local uploaded file
        let clipContent = '';
        if (selectedFile.type.startsWith('text/') || selectedFile.size < 100000) {
          try {
            clipContent = await selectedFile.text();
          } catch {
            clipContent = `[Binary file: ${selectedFile.name}]`;
          }
        } else {
          clipContent = `[Uploaded File: ${selectedFile.name}]`;
        }

        const created = await createPublicClip({
          title: selectedFile.name,
          content: clipContent,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type || 'application/octet-stream',
          minutes: 1440, // 24 hours
        });

        setGeneratedClip(created);
        setSelectedFile(null);
        setSelectedCloudFile(null);
      } else {
        // Sharing text / snippet
        const clipTitle = content.trim().split('\n')[0].slice(0, 35) || 'Shared Note';
        const created = await createPublicClip({
          title: clipTitle,
          content: content,
          fileName: 'note.txt',
          fileSize: new Blob([content]).size,
          mimeType: 'text/plain',
          minutes: 1440, // 24 hours
        });

        setGeneratedClip(created);
        setContent('');
      }
    } catch (err) {
      console.error('Error creating public clip:', err);
    } finally {
      setCreating(false);
    }
  };

  const cleanCodeInput = (val) => {
    if (!val) return '';
    let raw = val.trim();
    if (raw.includes('code=')) {
      try {
        const url = new URL(raw.startsWith('http') ? raw : `http://dummy.com/${raw}`);
        const codeParam = url.searchParams.get('code');
        if (codeParam) return codeParam.toUpperCase().trim();
      } catch {}
    }
    return raw.toUpperCase();
  };

  const handleRetrieveClip = async (codeToSearch = inputCode) => {
    const cleaned = cleanCodeInput(codeToSearch);
    if (!cleaned) return;

    setRetrieving(true);
    setRetrieveError('');
    setRetrievedClip(null);

    try {
      const clip = await getSharedClipByCode(cleaned);
      if (!clip) {
        setRetrieveError(`No active clip found for code "${cleaned}". It may have expired or does not exist.`);
      } else {
        setRetrievedClip(clip);
      }
    } catch (err) {
      setRetrieveError('Unable to retrieve clip. Please check the code and try again.');
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
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/?code=${encodeURIComponent(code)}`;
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
      const apiDownloadUrl = `/api/share/${encodeURIComponent(clip.share_code)}/download`;

      if (clip.is_cloud_file) {
        window.location.href = apiDownloadUrl;
      } else {
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
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const formatCountdown = (totalSecs) => {
    if (totalSecs <= 0) return 'Expired';
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${h}h ${m}m ${s < 10 ? '0' : ''}${s}s`;
    }
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const filteredCloudFiles = cloudFiles.filter((f) =>
    f.name.toLowerCase().includes(cloudSearchTerm.toLowerCase())
  );

  return (
    <div id="clipboard" className={`w-full ${className}`}>
      {/* Top Tab Switcher */}
      <div className="flex justify-center mb-2.5 sm:mb-3">
        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'share'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Share Content</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('receive')}
            className={`flex items-center gap-1.5 px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'receive'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Receive with Code</span>
          </button>
        </div>
      </div>

      {/* Main Card Container */}
      <div className={`bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-200/50 transition-all ${
        compact ? 'p-3.5 sm:p-4' : 'p-4.5 sm:p-5 lg:p-6'
      }`}>
        {/* Tab 1: Share Content */}
        {activeTab === 'share' && (
          <div>
            {generatedClip ? (
              /* Success Generated State */
              <div className="text-center py-2 sm:py-3 space-y-4 animate-in fade-in">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div className="space-y-0.5">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    Live & Ready to Share!
                  </h3>
                  <p className="text-xs text-slate-600">
                    Give this 6-digit code or share link with any device or friend.
                  </p>
                </div>

                {/* Share Code Card */}
                <div className="max-w-xs mx-auto p-3.5 rounded-2xl bg-slate-50 border-2 border-dashed border-blue-300 flex flex-col items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    6-Digit Share Code
                  </span>
                  <div className="text-3xl font-extrabold tracking-wider font-mono text-blue-600 select-all">
                    {generatedClip.share_code}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    <Clock className="w-3 h-3 animate-pulse" />
                    <span>Expires in {formatCountdown(secondsLeft)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(generatedClip.share_code)}
                    className="flex-1 min-w-[110px] py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(generatedClip.share_code)}
                    className="flex-1 min-w-[110px] py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownload(generatedClip)}
                    disabled={downloading}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Download className="w-3.5 h-3.5 text-blue-600" />}
                    <span>Download File ({generatedClip.file_name})</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedClip(null);
                      setSelectedFile(null);
                      setSelectedCloudFile(null);
                      setContent('');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    + Share Another Note or File
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateShare} className="space-y-2.5 sm:space-y-3">
                {/* Type Switcher */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Content Type:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShareType('text');
                        setSelectedFile(null);
                        setSelectedCloudFile(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        shareType === 'text'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span>Text / Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareType('file')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        shareType === 'file'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>File Sharing</span>
                    </button>
                  </div>
                </div>

                {/* Text Content Mode */}
                {shareType === 'text' ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                        Paste Note, Code, or URL
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {content.length} chars
                      </span>
                    </div>
                    <textarea
                      rows={compact ? 3 : 4}
                      required
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Paste text, code snippets, passwords, meeting links, or tokens here..."
                      className={`w-full rounded-xl border border-slate-200 ${
                        compact ? 'p-2.5' : 'p-3'
                      } text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 hover:bg-white focus:bg-white transition leading-relaxed resize-y`}
                    />
                  </div>
                ) : (
                  /* File Mode: Supports both Local Device and Cloud Vault Files */
                  <div className="space-y-2.5">
                    {selectedCloudFile ? (
                      /* Selected Cloud File Box */
                      <div className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50/40 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Cloud className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {selectedCloudFile.name}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 text-[10px] font-semibold">
                                Cloud Vault
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {formatBytes(selectedCloudFile.size_bytes)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handleOpenCloudPicker}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCloudFile(null)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 transition"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : selectedFile ? (
                      /* Selected Local Device File Box */
                      <div className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50/40 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                            <File className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {selectedFile.name}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                                From Device
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {formatBytes(selectedFile.size)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedFile(null)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 transition"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* No file selected yet: Offer Upload and Cloud Vault buttons */
                      <div className="space-y-2">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20 rounded-xl text-center cursor-pointer transition ${
                            compact ? 'p-3' : 'p-4 sm:p-5'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              setSelectedFile(e.target.files?.[0] || null);
                              setSelectedCloudFile(null);
                            }}
                          />
                          <div className="flex flex-col items-center">
                            <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mb-1" />
                            <span className="font-semibold text-slate-700 text-xs sm:text-sm">
                              Click or drop to upload from device
                            </span>
                            <span className="text-slate-400 text-[10px] sm:text-xs">
                              Documents, images, zip, audio, code up to 50MB
                            </span>
                          </div>
                        </div>

                        {/* BUTTON TO ADD EXISTING FILES FROM CLOUD VAULT - Only visible inside dashboard */}
                        {showCloudVault && (
                          <button
                            type="button"
                            onClick={handleOpenCloudPicker}
                            className="w-full py-2 px-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                          >
                            <Cloud className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>Choose Existing File from Cloud Vault</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Expiry Notice */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-2 text-[11px] text-blue-800">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    <strong>24h Expiry:</strong> Self-destructs after 24 hours • No login needed to retrieve.
                  </span>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={
                    creating ||
                    (shareType === 'text' && !content.trim()) ||
                    (shareType === 'file' && !selectedFile && !selectedCloudFile)
                  }
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Code...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Generate 6-Digit Share Code</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Receive with Code */}
        {activeTab === 'receive' && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRetrieveClip();
              }}
              className="space-y-2"
            >
              <label
                htmlFor="receive-code-input"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
              >
                Enter 6-Digit Share Code
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <input
                    id="receive-code-input"
                    type="text"
                    maxLength={15}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SKY-4921"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs sm:text-sm font-mono font-bold tracking-wider uppercase text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 hover:bg-white focus:bg-white transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={retrieving || !inputCode.trim()}
                  className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {retrieving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Retrieve</span>
                  )}
                </button>
              </div>
            </form>

            {retrieveError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{retrieveError}</span>
              </div>
            )}

            {/* Retrieved Clip Display */}
            {retrievedClip && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs animate-in fade-in">
                <div className="bg-slate-50 px-3.5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-1.5">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {retrievedClip.title || retrievedClip.file_name}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>Code: {retrievedClip.share_code}</span>
                      <span>•</span>
                      <span>{formatBytes(retrievedClip.file_size)}</span>
                      {retrievedClip.is_cloud_file && (
                        <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded text-[9px] font-semibold">
                          Cloud File
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Clock className="w-3 h-3 animate-pulse" />
                    <span>Expires in {formatCountdown(secondsLeft)}</span>
                  </div>
                </div>

                <div className="p-3 bg-white space-y-2.5">
                  {retrievedClip.content ? (
                    <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto max-h-48 whitespace-pre-wrap select-all">
                      {retrievedClip.content}
                    </pre>
                  ) : (
                    <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <File className="w-7 h-7 text-blue-600 mx-auto mb-1" />
                      <span className="text-xs font-semibold text-slate-800">
                        {retrievedClip.file_name}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(retrievedClip)}
                      disabled={downloading}
                      className="flex-1 min-w-[120px] py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Download File</span>
                    </button>

                    {retrievedClip.content && (
                      <button
                        type="button"
                        onClick={() => handleCopyContent(retrievedClip.content)}
                        className="py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedContent ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{copiedContent ? 'Copied!' : 'Copy Content'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setRetrievedClip(null);
                        setInputCode('');
                      }}
                      className="py-1.5 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold transition cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CLOUD FILE PICKER MODAL (Inside Dashboard only) */}
      {showCloudVault && cloudPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Select File from Cloud Vault
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pick any file stored in your cloud storage to share
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCloudPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex-1 overflow-y-auto">
              {notLoggedInPrompt ? (
                <div className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Sign In Required
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Sign in to your SkyBox account to access and share your private cloud vault files.
                    </p>
                  </div>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-xs transition"
                  >
                    <span>Sign In Now</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={cloudSearchTerm}
                      onChange={(e) => setCloudSearchTerm(e.target.value)}
                      placeholder="Search files by name..."
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50"
                    />
                  </div>

                  {cloudFilesLoading ? (
                    <div className="p-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="text-xs">Loading vault files...</span>
                    </div>
                  ) : filteredCloudFiles.length > 0 ? (
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {filteredCloudFiles.map((f) => (
                        <div
                          key={f.id}
                          onClick={() => handleSelectCloudFile(f)}
                          className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-between gap-3 cursor-pointer transition group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <File className="w-4 h-4 text-blue-600 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-600">
                                {f.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {formatBytes(f.size_bytes)}
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-blue-600 shrink-0 group-hover:underline">
                            Select
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">
                      {cloudSearchTerm ? 'No matching files found.' : 'No files found in your cloud vault.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

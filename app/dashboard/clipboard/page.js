'use client';

import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Copy,
  Check,
  Clock,
  RotateCcw,
  Trash2,
  Plus,
  Pin,
  Loader2,
  Sparkles,
  Shield,
  AlertCircle
} from 'lucide-react';
import {
  getClipboardItems,
  createClip,
  extendClipTimer,
  togglePinClip,
  deleteClip,
  clearAllClips
} from '@/lib/clipboard';

function ClipCountdown({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [percentRemaining, setPercentRemaining] = useState(100);

  useEffect(() => {
    function updateTimer() {
      const diffMs = new Date(expiresAt).getTime() - Date.now();

      if (diffMs <= 0) {
        setTimeLeft('Expired');
        setPercentRemaining(0);
        onExpire?.();
        return;
      }

      const totalMs = 60 * 60 * 1000; // 60 mins
      const pct = Math.max(0, Math.min(100, (diffMs / totalMs) * 100));
      setPercentRemaining(pct);

      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      setTimeLeft(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isUrgent = percentRemaining < 20;

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 text-xs font-semibold ${
        isUrgent ? 'text-red-600' : 'text-blue-600'
      }`}>
        <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'animate-pulse' : ''}`} />
        <span>{timeLeft}</span>
      </div>

      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
        <div
          className={`h-full transition-all duration-1000 ${
            isUrgent ? 'bg-red-500' : 'bg-blue-600'
          }`}
          style={{ width: `${percentRemaining}%` }}
        />
      </div>
    </div>
  );
}

export default function ClipboardPage() {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState(60);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchClips = async () => {
    try {
      const data = await getClipboardItems();
      setClips(data);
    } catch (err) {
      console.error('Failed to fetch clipboard items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClips();
  }, []);

  const handleCreateClip = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setSaving(true);
    try {
      const autoTitle = newTitle.trim() || newContent.trim().split('\n')[0].slice(0, 30) || 'Untitled Clip';
      const created = await createClip({
        title: autoTitle,
        content: newContent,
        minutes: timeoutMinutes,
      });

      setClips((prev) => [created, ...prev]);
      setNewTitle('');
      setNewContent('');
      setToastMessage('Clip added! Expires in 60 minutes.');
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (clip) => {
    try {
      await navigator.clipboard.writeText(clip.content);
      setCopiedId(clip.id);
      setToastMessage('Copied to your device clipboard!');
      setTimeout(() => {
        setCopiedId(null);
        setToastMessage('');
      }, 2500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleExtend = async (clipId) => {
    try {
      const updated = await extendClipTimer(clipId, 60);
      setClips((prev) => prev.map((c) => (c.id === clipId ? updated : c)));
      setToastMessage('Timeout extended by +60 minutes!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePin = async (clip) => {
    try {
      const updated = await togglePinClip(clip.id, !clip.is_pinned);
      setClips((prev) =>
        prev
          .map((c) => (c.id === clip.id ? updated : c))
          .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (clipId) => {
    try {
      await deleteClip(clipId);
      setClips((prev) => prev.filter((c) => c.id !== clipId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all items from your online clipboard?')) return;
    try {
      await clearAllClips();
      setClips([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white text-xs shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-green-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>60-Minute Auto-Timeout Enforced</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            <span>Online Clipboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fast device-to-device text and code synchronization. Snippets automatically self-destruct after 60 minutes.
          </p>
        </div>

        {clips.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Clips</span>
          </button>
        )}
      </div>

      {/* Add New Clip Input Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Add New Clip</span>
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Timeout:</span>
            <select
              value={timeoutMinutes}
              onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={60}>60 Minutes (Standard)</option>
              <option value={30}>30 Minutes</option>
              <option value={15}>15 Minutes (Quick)</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleCreateClip} className="space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Label / Title (optional, e.g. API Key, WiFi Password, Zoom Link)"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 hover:bg-white focus:bg-white transition"
          />

          <textarea
            required
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            placeholder="Paste text, code snippets, links, or tokens here to access across your devices..."
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 hover:bg-white focus:bg-white transition resize-y"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              {newContent.length} characters
            </span>
            <button
              type="submit"
              disabled={saving || !newContent.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Save to Clipboard</span>
            </button>
          </div>
        </form>
      </div>

      {/* Active Clips Listing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Clips ({clips.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Encrypted & Private to your account
          </span>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center items-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : clips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clips.map((clip) => {
              const isCopied = copiedId === clip.id;
              return (
                <div
                  key={clip.id}
                  className={`p-5 rounded-3xl bg-white border transition shadow-2xs flex flex-col justify-between space-y-3 ${
                    clip.is_pinned
                      ? 'border-amber-300 ring-1 ring-amber-300/40'
                      : 'border-slate-200 hover:border-blue-400'
                  }`}
                >
                  {/* Clip Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {clip.is_pinned && (
                          <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                        )}
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {clip.title}
                        </h4>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Added {new Date(clip.created_at).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <ClipCountdown
                      expiresAt={clip.expires_at}
                      onExpire={() => {
                        setClips((prev) => prev.filter((c) => c.id !== clip.id));
                      }}
                    />
                  </div>

                  {/* Clip Content Box */}
                  <div className="relative group">
                    <pre className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono text-slate-800 overflow-x-auto max-h-48 whitespace-pre-wrap break-all leading-relaxed">
                      {clip.content}
                    </pre>
                  </div>

                  {/* Clip Action Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTogglePin(clip)}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          clip.is_pinned
                            ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        }`}
                        title={clip.is_pinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin className={`w-3.5 h-3.5 ${clip.is_pinned ? 'fill-amber-400' : ''}`} />
                      </button>

                      <button
                        onClick={() => handleExtend(clip.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition cursor-pointer text-[11px]"
                        title="Extend timer for another 60 minutes"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>+60m</span>
                      </button>

                      <button
                        onClick={() => handleDelete(clip.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete clip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleCopy(clip)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold transition cursor-pointer shadow-2xs ${
                        isCopied
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xs">
              <ClipboardList className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Your online clipboard is empty
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Paste any snippet, URL, password, or code above. It will be available across your phone, tablet, and PC, and will automatically expire in 60 minutes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

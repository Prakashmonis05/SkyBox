'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  X,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Folder,
  AlertTriangle
} from 'lucide-react';
import {
  createTextFile,
  updateTextFile,
  loadTextFileContent,
  ensureTxtExtension,
} from '@/lib/textFiles';

export default function TextEditorModal({
  isOpen,
  onClose,
  folderId = null,
  folderName = 'My Files',
  editingFile = null, // If null -> create mode, if provided -> edit mode
  onFileSaved,
}) {
  const [fileName, setFileName] = useState('Untitled.txt');
  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [initialName, setInitialName] = useState('Untitled.txt');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('clean'); // 'clean' | 'dirty' | 'saving' | 'saved'
  const [lastSavedTime, setLastSavedTime] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setShowExitConfirm(false);

      if (editingFile) {
        // Edit mode
        setFileName(editingFile.name || 'Untitled.txt');
        setInitialName(editingFile.name || 'Untitled.txt');
        setLoading(true);

        loadTextFileContent(editingFile.storage_path)
          .then((text) => {
            setContent(text);
            setInitialContent(text);
            setSaveStatus('clean');
          })
          .catch((err) => {
            setError(err.message || 'Failed to load file content.');
          })
          .finally(() => setLoading(false));
      } else {
        // Create mode
        setFileName('Untitled.txt');
        setInitialName('Untitled.txt');
        setContent('');
        setInitialContent('');
        setSaveStatus('clean');
        setLoading(false);
      }
    }
  }, [isOpen, editingFile]);

  // Track if content or filename changed
  const isDirty = content !== initialContent || fileName !== initialName;

  const handleContentChange = (e) => {
    setContent(e.target.value);
    if (saveStatus !== 'dirty') {
      setSaveStatus('dirty');
    }
  };

  const handleNameChange = (e) => {
    setFileName(e.target.value);
    if (saveStatus !== 'dirty') {
      setSaveStatus('dirty');
    }
  };

  const handleSave = async () => {
    if (!fileName.trim()) {
      setError('Please provide a filename.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let savedRecord;
      if (editingFile) {
        // Update existing text file
        savedRecord = await updateTextFile({
          fileId: editingFile.id,
          storagePath: editingFile.storage_path,
          name: fileName,
          content,
        });
      } else {
        // Create new text file
        savedRecord = await createTextFile({
          name: fileName,
          content,
          folderId,
        });
      }

      setInitialContent(content);
      setInitialName(savedRecord.name);
      setFileName(savedRecord.name);
      setSaveStatus('saved');
      setLastSavedTime(
        new Date().toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );

      onFileSaved?.(savedRecord);
    } catch (err) {
      setError(err.message || 'Failed to save text file.');
      setSaveStatus('dirty');
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isOpen && !saving) {
          handleSave();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Counts
  const characterCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content.split('\n').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-5xl h-[92vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Unsaved Changes Confirmation Dialog */}
        {showExitConfirm && (
          <div className="absolute inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Unsaved Changes</h4>
                  <p className="text-xs text-slate-500">You have unsaved edits in this file</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you leave now without saving, your recent changes will be discarded. Do you want to save your file or discard changes?
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  Discard & Exit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowExitConfirm(false);
                    await handleSave();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20"
                >
                  Save & Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>

            {/* Filename Input */}
            <div className="min-w-0 flex-1 max-w-md">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={fileName}
                  onChange={handleNameChange}
                  onBlur={() => setFileName(ensureTxtExtension(fileName))}
                  placeholder="Untitled.txt"
                  className="text-sm font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white px-2 py-1 rounded-lg border border-transparent focus:border-blue-500 focus:outline-none transition w-full"
                />
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 px-2">
                <Folder className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Saving inside: <span className="font-semibold text-slate-600">{folderName}</span></span>
              </div>
            </div>
          </div>

          {/* Right Header Status & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Status indicator */}
            <div className="text-xs">
              {saving ? (
                <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : saveStatus === 'saved' ? (
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved at {lastSavedTime}</span>
                </span>
              ) : isDirty ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium">
                  Unsaved changes
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">All changes saved</span>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || (!isDirty && saveStatus === 'saved')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Save</span>
              <span className="hidden sm:inline text-[10px] opacity-75 font-mono ml-0.5">(Ctrl+S)</span>
            </button>

            {/* Close Button */}
            <button
              onClick={handleAttemptClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="Close editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="px-6 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Plain-Text Editing Area */}
        <div className="flex-1 p-4 sm:p-6 flex flex-col bg-slate-50/50 min-h-0">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs">Loading note contents...</span>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={handleContentChange}
              autoFocus
              placeholder="Start typing your notes or paste text here... Every change is saved directly to your private cloud storage."
              className="flex-1 w-full bg-white border border-slate-200/90 rounded-2xl p-5 text-sm font-mono text-slate-800 placeholder-slate-400 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
            />
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="px-6 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span>Lines: <strong className="text-slate-700">{lineCount}</strong></span>
            <span>Words: <strong className="text-slate-700">{wordCount}</strong></span>
            <span>Characters: <strong className="text-slate-700">{characterCount}</strong></span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>Plain Text (.txt)</span>
            <span>•</span>
            <span>UTF-8</span>
          </div>
        </div>
      </div>
    </div>
  );
}

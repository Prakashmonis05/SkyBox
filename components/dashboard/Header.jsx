'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Menu,
  Search,
  Plus,
  UploadCloud,
  FolderPlus,
  FileText,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Loader2,
  Folder,
  File,
  X
} from 'lucide-react';
import NewFolderModal from './NewFolderModal';
import UploadModal from './UploadModal';
import TextEditorModal from './TextEditorModal';
import FilePreviewModal from './FilePreviewModal';
import { getFileTypeIcon } from './FileItem';
import { formatBytes } from '@/lib/files';

function HeaderContent({ onMenuClick, user, profile }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFolderId = searchParams?.get('folderId') || null;

  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Modals state
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [textEditorModalOpen, setTextEditorModalOpen] = useState(false);
  const [editingTextFile, setEditingTextFile] = useState(null);
  const [searchPreviewFile, setSearchPreviewFile] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ folders: [], files: [] });
  const [searching, setSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const newMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const searchRef = useRef(null);
  const supabase = createClient();

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (newMenuRef.current && !newMenuRef.current.contains(event.target)) {
        setNewDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Search implementation (300ms debounce)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ folders: [], files: [] });
      setSearchDropdownOpen(false);
      return;
    }

    setSearching(true);
    setSearchDropdownOpen(true);

    const timer = setTimeout(async () => {
      try {
        const queryTerm = searchQuery.trim();
        const [foldersRes, filesRes] = await Promise.all([
          supabase
            .from('folders')
            .select('id, name')
            .ilike('name', `%${queryTerm}%`)
            .is('deleted_at', null)
            .limit(5),
          supabase
            .from('files')
            .select('*')
            .ilike('name', `%${queryTerm}%`)
            .is('deleted_at', null)
            .limit(8),
        ]);

        setSearchResults({
          folders: foldersRes.data || [],
          files: filesRes.data || [],
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || 'user@example.com';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <NewFolderModal
        isOpen={newFolderModalOpen}
        onClose={() => setNewFolderModalOpen(false)}
        parentId={currentFolderId}
        parentName={currentFolderId ? 'Current Folder' : 'My Files'}
        onFolderCreated={() => router.refresh()}
      />

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folderId={currentFolderId}
        folderName={currentFolderId ? 'Current Folder' : 'My Files'}
        onUploadComplete={() => router.refresh()}
      />

      <TextEditorModal
        isOpen={textEditorModalOpen}
        onClose={() => {
          setTextEditorModalOpen(false);
          setEditingTextFile(null);
        }}
        folderId={currentFolderId}
        folderName={currentFolderId ? 'Current Folder' : 'My Files'}
        editingFile={editingTextFile}
        onFileSaved={() => router.refresh()}
      />

      <FilePreviewModal
        isOpen={Boolean(searchPreviewFile)}
        onClose={() => setSearchPreviewFile(null)}
        file={searchPreviewFile}
      />

      <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left section: mobile hamburger & debounced search bar */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Debounced Search Bar */}
          <div className="relative w-full" ref={searchRef}>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setSearchDropdownOpen(true);
              }}
              placeholder="Search files, folders, and notes..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchDropdownOpen(false);
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Search Dropdown Results */}
            {searchDropdownOpen && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-12 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-50 text-xs max-h-96 overflow-y-auto">
                {searching ? (
                  <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Searching your vault...</span>
                  </div>
                ) : searchResults.folders.length === 0 && searchResults.files.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    No files or folders matching &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Folders matches */}
                    {searchResults.folders.length > 0 && (
                      <div>
                        <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Folders
                        </div>
                        {searchResults.folders.map((folder) => (
                          <button
                            key={folder.id}
                            type="button"
                            onClick={() => {
                              setSearchDropdownOpen(false);
                              router.push(`/dashboard/files?folderId=${folder.id}`);
                            }}
                            className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                          >
                            <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">
                              {folder.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Files matches */}
                    {searchResults.files.length > 0 && (
                      <div>
                        <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 mt-1 pt-1.5">
                          Files
                        </div>
                        {searchResults.files.map((file) => {
                          const { icon: FileIcon, color } = getFileTypeIcon(
                            file.mime_type,
                            file.name
                          );
                          const isTxt = file.name.endsWith('.txt') || file.mime_type === 'text/plain';

                          return (
                            <button
                              key={file.id}
                              type="button"
                              onClick={() => {
                                setSearchDropdownOpen(false);
                                if (isTxt) {
                                  setEditingTextFile(file);
                                  setTextEditorModalOpen(true);
                                } else {
                                  setSearchPreviewFile(file);
                                }
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between gap-2.5 transition cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileIcon className={`w-4 h-4 ${color} shrink-0`} />
                                <span className="font-semibold text-slate-800 truncate">
                                  {file.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {formatBytes(file.size_bytes)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right section: Action buttons and User profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Upload Button */}
          <button
            onClick={() => setUploadModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>Upload</span>
          </button>

          {/* + New Button with Dropdown */}
          <div className="relative" ref={newMenuRef}>
            <button
              onClick={() => setNewDropdownOpen(!newDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">New</span>
              <ChevronDown className={`w-3.5 h-3.5 transition ${newDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {newDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 text-xs">
                {/* 1. New Folder */}
                <button
                  onClick={() => {
                    setNewDropdownOpen(false);
                    setNewFolderModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-slate-900 font-semibold">New Folder</div>
                    <div className="text-[10px] text-slate-400">Create a subfolder</div>
                  </div>
                </button>

                {/* 2. New Text File (.txt) */}
                <button
                  onClick={() => {
                    setNewDropdownOpen(false);
                    setEditingTextFile(null);
                    setTextEditorModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-slate-900 font-semibold">New Text File (.txt)</div>
                    <div className="text-[10px] text-slate-400">Open plain-text note editor</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                {/* 3. Upload Files */}
                <button
                  onClick={() => {
                    setNewDropdownOpen(false);
                    setUploadModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium transition cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="text-slate-900 font-semibold">Upload Files</div>
                    <div className="text-[10px] text-slate-400">Pick files from your device</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative ml-1" ref={profileMenuRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center">
                {initial}
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown className="hidden lg:inline w-3 h-3 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="font-semibold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{displayEmail}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                    Personal Vault Active
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700 font-medium transition"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2.5 font-medium transition cursor-pointer"
                  >
                    {loggingOut ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default function Header(props) {
  return (
    <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
      <HeaderContent {...props} />
    </Suspense>
  );
}

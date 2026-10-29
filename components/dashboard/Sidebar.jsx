'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  getUserStorageUsage,
  formatBytes,
  STORAGE_LIMIT_BYTES,
} from '@/lib/files';
import {
  Cloud,
  HardDrive,
  Folder,
  Clock,
  Star,
  Trash2,
  Settings,
  X,
  Database,
  ClipboardList,
} from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: HardDrive },
  { name: 'My Files', href: '/dashboard/files', icon: Folder },
  { name: 'Online Clipboard', href: '/dashboard/clipboard', icon: ClipboardList, badge: '24h' },
  { name: 'Recent', href: '/dashboard/recent', icon: Clock },
  { name: 'Starred', href: '/dashboard/starred', icon: Star },
  { name: 'Trash', href: '/dashboard/trash', icon: Trash2 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose, initialUsedBytes = 0 }) {
  const pathname = usePathname();
  const [usedBytes, setUsedBytes] = useState(initialUsedBytes);

  useEffect(() => {
    if (initialUsedBytes > 0) {
      setUsedBytes(initialUsedBytes);
    }
  }, [initialUsedBytes]);

  useEffect(() => {
    let isMounted = true;
    const fetchStorage = () => {
      getUserStorageUsage()
        .then((u) => {
          if (isMounted && typeof u?.totalBytes === 'number') {
            setUsedBytes(u.totalBytes);
          }
        })
        .catch(() => {});
    };

    fetchStorage();

    const handleStorageEvent = (e) => {
      if (typeof e?.detail?.totalBytes === 'number') {
        if (isMounted) setUsedBytes(e.detail.totalBytes);
      } else {
        fetchStorage();
      }
    };

    // Re-fetch automatically when files are uploaded, deleted, restored, or edited
    window.addEventListener('skybox:storage-updated', handleStorageEvent);
    window.addEventListener('focus', fetchStorage);

    return () => {
      isMounted = false;
      window.removeEventListener('skybox:storage-updated', handleStorageEvent);
      window.removeEventListener('focus', fetchStorage);
    };
  }, [pathname]);

  const rawPercentage = (usedBytes / STORAGE_LIMIT_BYTES) * 100;
  const displayPercentage =
    usedBytes === 0
      ? '0%'
      : rawPercentage < 0.1
      ? '< 0.1%'
      : rawPercentage < 1
      ? `${rawPercentage.toFixed(1)}%`
      : `${Math.min(100, Math.round(rawPercentage))}%`;

  const barWidth =
    usedBytes === 0 ? 0 : Math.max(Math.min(100, rawPercentage), 2);
  const remainingBytes = Math.max(0, STORAGE_LIMIT_BYTES - usedBytes);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Logo & Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/logo.png"
                alt="SkyBox Logo"
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                Sky<span className="text-blue-600">Box</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
                Cloud Vault
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Storage Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
                <div className="flex items-center justify-between w-full">
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 tracking-wide">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Storage Usage Widget in Sidebar */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>Vault Storage</span>
              </span>
              <span
                className={`font-semibold ${
                  rawPercentage >= 90
                    ? 'text-red-600'
                    : rawPercentage >= 75
                    ? 'text-amber-600'
                    : 'text-blue-600'
                }`}
              >
                {displayPercentage}
              </span>
            </div>

            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  rawPercentage >= 90
                    ? 'bg-red-500'
                    : rawPercentage >= 75
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{formatBytes(usedBytes)} used</span>
              <span>{formatBytes(remainingBytes)} free</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

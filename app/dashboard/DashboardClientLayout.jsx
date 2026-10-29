'use client';

import { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import SessionTimeoutWatcher from '@/components/dashboard/SessionTimeoutWatcher';

export default function DashboardClientLayout({
  user,
  profile,
  initialUsedBytes = 0,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 60-Minute Inactivity Session Watchdog */}
      <SessionTimeoutWatcher />

      {/* Sidebar navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        initialUsedBytes={initialUsedBytes}
      />

      {/* Main dashboard content area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          profile={profile}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Clock } from 'lucide-react';
import OnlineClipboard from '@/components/OnlineClipboard';

export default function DashboardClipboardPage() {
  const [shareFileId, setShareFileId] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fileId = params.get('shareFileId');
      if (fileId) {
        setShareFileId(fileId);
      }
    }
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
          <Clock className="w-3.5 h-3.5" />
          <span>24-Hour Fast Sharing • No Sign-In Required to Receive</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
          <ClipboardList className="w-6 h-6 text-blue-600" />
          <span>Online Clipboard</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Share text snippets, upload files, or select files directly from your cloud vault to generate an instant 6-digit code.
        </p>
      </div>

      <OnlineClipboard initialFileId={shareFileId} showCloudVault={true} />
    </div>
  );
}


'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClipboardList, Clock, Sparkles } from 'lucide-react';
import OnlineClipboard from '@/components/OnlineClipboard';

function DashboardClipboardContent() {
  const searchParams = useSearchParams();
  const shareFileId = searchParams?.get('shareFileId') || '';

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

export default function DashboardClipboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400">
          Loading clipboard...
        </div>
      }
    >
      <DashboardClipboardContent />
    </Suspense>
  );
}

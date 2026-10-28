'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Clock, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

const TIMEOUT_DURATION_MS = 60 * 60 * 1000; // 60 minutes
const WARNING_THRESHOLD_MS = 55 * 60 * 1000; // Show warning with 5 minutes remaining
const STORAGE_KEY = 'skybox_last_active_timestamp';

export default function SessionTimeoutWatcher() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const lastRecordedRef = useRef(Date.now());
  const supabase = createClient();

  const resetActivityTimer = useCallback(() => {
    const now = Date.now();
    lastRecordedRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEY, now.toString());
    } catch {}
    setShowWarning(false);
  }, []);

  const handleSignOutDueToInactivity = useCallback(async () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error logging out due to inactivity:', err);
    } finally {
      router.push('/login?reason=timeout');
    }
  }, [router, supabase]);

  useEffect(() => {
    // Initialize or restore timestamp
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      } else {
        lastRecordedRef.current = parseInt(stored, 10) || Date.now();
      }
    } catch {
      lastRecordedRef.current = Date.now();
    }

    // Debounced activity listeners
    let throttleTimer = null;
    const onUserActivity = () => {
      const now = Date.now();
      // Throttle localStorage writes to once every 10 seconds
      if (!throttleTimer && now - lastRecordedRef.current > 10000) {
        throttleTimer = setTimeout(() => {
          lastRecordedRef.current = Date.now();
          try {
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
          } catch {}
          throttleTimer = null;
        }, 500);
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, onUserActivity, { passive: true }));

    // Also sync across multiple browser tabs with storage event
    const onStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const parsed = parseInt(e.newValue, 10);
        if (!isNaN(parsed)) {
          lastRecordedRef.current = parsed;
          setShowWarning(false);
        }
      }
    };
    window.addEventListener('storage', onStorageChange);

    // Watchdog interval to check elapsed idle time
    const interval = setInterval(() => {
      let lastActive = lastRecordedRef.current;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          lastActive = parseInt(stored, 10) || lastActive;
        }
      } catch {}

      const elapsed = Date.now() - lastActive;

      if (elapsed >= TIMEOUT_DURATION_MS) {
        clearInterval(interval);
        handleSignOutDueToInactivity();
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        setShowWarning(true);
        const remaining = Math.max(0, Math.floor((TIMEOUT_DURATION_MS - elapsed) / 1000));
        setSecondsRemaining(remaining);
      } else {
        if (showWarning) setShowWarning(false);
      }
    }, 2000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onUserActivity));
      window.removeEventListener('storage', onStorageChange);
      clearInterval(interval);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [handleSignOutDueToInactivity, showWarning]);

  if (!showWarning) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center relative overflow-hidden">
        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />

        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Clock className="w-7 h-7 animate-pulse" />
        </div>

        <h3 className="text-xl font-bold text-slate-900">
          Inactivity Timeout Warning
        </h3>
        <p className="text-sm text-slate-600 mt-2">
          For your vault&apos;s privacy and security, SkyBox automatically signs you out after 60 minutes of inactivity.
        </p>

        <div className="my-5 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-center gap-2 text-amber-900 font-mono text-2xl font-bold">
          <span>{timeFormatted}</span>
          <span className="text-xs font-sans font-medium text-amber-700 uppercase tracking-wider">
            remaining
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={resetActivityTimer}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>I&apos;m Still Here</span>
          </button>
          <button
            type="button"
            onClick={handleSignOutDueToInactivity}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition cursor-pointer"
          >
            Sign Out Now
          </button>
        </div>
      </div>
    </div>
  );
}

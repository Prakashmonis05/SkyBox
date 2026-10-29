'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  getUserStorageUsage,
  formatBytes,
  STORAGE_LIMIT_BYTES,
} from '@/lib/files';
import {
  Settings,
  User,
  Mail,
  Shield,
  Key,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Lock,
  Database,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [usedBytes, setUsedBytes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser(authUser);
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (profileData) {
            setProfile(profileData);
            setFullName(profileData.full_name || '');
          } else {
            setFullName(authUser.user_metadata?.full_name || '');
          }

          // Fetch storage quota usage
          try {
            const usage = await getUserStorageUsage();
            setUsedBytes(usage.totalBytes);
          } catch {}
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (!user) throw new Error('No authenticated user session found.');

      // Update in Supabase profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
        })
        .eq('id', user.id);

      // Also update auth user metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (profileError) {
        setError(profileError.message);
      } else {
        setMessage('Profile updated successfully.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });
      if (!error) {
        setResetEmailSent(true);
        setTimeout(() => setResetEmailSent(false), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const createdDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>Account Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal vault identity, authentication, and security preferences.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Details Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
          <p className="text-xs text-slate-500">
            This name will be displayed on your personal cloud vault.
          </p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Name
            </label>
            <div className="relative rounded-xl max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Name"
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 sm:text-sm bg-slate-50 hover:bg-white focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Account Email
            </label>
            <div className="relative rounded-xl max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-slate-500 sm:text-sm bg-slate-100 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Primary email used for logins and password recovery.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Profile</span>
          </button>
        </form>
      </div>

      {/* Storage Quota & Plan */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Storage Quota & Plan</h2>
            <p className="text-xs text-slate-500">
              Your personal cloud allocation and usage.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
            1 GB Free Tier
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600">Storage Used</span>
            <span className="text-slate-900 font-bold font-mono">
              {formatBytes(usedBytes)} / 1 GB ({Math.min(100, Math.round((usedBytes / STORAGE_LIMIT_BYTES) * 100))}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usedBytes / STORAGE_LIMIT_BYTES >= 0.9
                  ? 'bg-red-500'
                  : usedBytes / STORAGE_LIMIT_BYTES >= 0.75
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{
                width: `${Math.max(
                  Math.min(100, Math.round((usedBytes / STORAGE_LIMIT_BYTES) * 100)),
                  1
                )}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>Enforced on all uploads & notes</span>
            <span>{formatBytes(Math.max(0, STORAGE_LIMIT_BYTES - usedBytes))} available</span>
          </div>
        </div>
      </div>

      {/* Account & Security Information */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Security & Authentication</h2>
          <p className="text-xs text-slate-500">
            Your vault security credentials and access tokens.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-slate-500" />
              <div>
                <div className="font-semibold text-slate-900">Password Management</div>
                <div className="text-slate-500">Update or reset your login password</div>
              </div>
            </div>
            <button
              onClick={handleSendPasswordReset}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium transition cursor-pointer"
            >
              {resetEmailSent ? 'Email Sent ✓' : 'Send Reset Link'}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div>
                <div className="font-semibold text-slate-900">Account Created</div>
                <div className="text-slate-500">Member since {createdDate}</div>
              </div>
            </div>
            <span className="font-mono text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
              Active
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-blue-600" />
              <div>
                <div className="font-semibold text-slate-900">PostgreSQL Row-Level Security</div>
                <div className="text-slate-500">Storage path: {user?.id ? `${user.id.slice(0, 8)}...` : 'Vault Isolated'}</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Enforced
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            Sign out of your session on this browser
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

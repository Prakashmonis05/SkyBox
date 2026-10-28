'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Cloud,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const [email, setEmail] = useState(emailParam);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const supabase = createClient();

  // Cooldown timer for resending verification code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Check if current session is already verified
  const checkVerificationStatus = async () => {
    setCheckingStatus(true);
    setErrorMessage('');
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        setErrorMessage(error.message);
        setCheckingStatus(false);
        return;
      }

      if (user?.email_confirmed_at) {
        setIsVerified(true);
        setSuccessMessage('Email verified successfully! Redirecting to your vault...');
        setTimeout(() => {
          router.push(redirectTo);
          router.refresh();
        }, 1500);
      } else {
        setErrorMessage('Your email is not verified yet. Please check your inbox or enter the 6-digit code below.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error checking verification status.');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Submit 6-digit OTP token
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // First try signup type OTP
      let { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'signup',
      });

      // If signup type fails, attempt with email type (magic link / confirmation)
      if (error) {
        const emailAttempt = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: token.trim(),
          type: 'email',
        });
        if (!emailAttempt.error) {
          data = emailAttempt.data;
          error = null;
        }
      }

      if (error) {
        setErrorMessage(error.message || 'Invalid or expired verification code.');
        setLoading(false);
        return;
      }

      setIsVerified(true);
      setSuccessMessage('Email verified! Setting up your secure cloud space...');
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || 'Verification failed. Please check the code.');
      setLoading(false);
    }
  };

  // Resend email confirmation
  const handleResend = async () => {
    if (!email) {
      setErrorMessage('Please provide an email address to resend the code.');
      return;
    }
    if (resendCooldown > 0) return;

    setResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });

      if (error) {
        // Fallback try with email change / confirmation
        const alt = await supabase.auth.resend({
          type: 'email_change',
          email: email.trim(),
        });
        if (alt.error) {
          setErrorMessage(error.message);
          setResending(false);
          return;
        }
      }

      setSuccessMessage(`A fresh verification code and link has been sent to ${email}.`);
      setResendCooldown(60);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
            <Cloud className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Sky<span className="text-blue-600">Box</span>
          </span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Verify your email address
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          We need to verify your email before granting access to your personal cloud vault.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          {/* Email badge illustration */}
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-6 shadow-xs">
            <Mail className="w-7 h-7" />
          </div>

          {email && (
            <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-xs text-slate-500 block mb-0.5 font-medium">
                Verification sent to:
              </span>
              <span className="text-sm font-semibold text-slate-800 break-all">
                {email}
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-sm text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {isVerified ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="font-semibold text-slate-900">Verification complete!</p>
              <p className="text-xs text-slate-500 mt-1">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Confirm Email
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@gmail.com"
                    className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 sm:text-sm bg-slate-50/50 hover:bg-white focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="otp-code"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  6-Digit Verification Code
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    id="otp-code"
                    type="text"
                    required
                    maxLength={8}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="123456"
                    className="block w-full rounded-xl border border-slate-200 pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 tracking-widest text-center font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 hover:bg-white focus:bg-white transition"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Enter the code sent to your inbox, or simply click the confirmation link in the email.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 shadow-sm shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Code & Continue</span>
                  </>
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-medium">
                    Or already clicked the link?
                  </span>
                </div>
              </div>

              {/* Already confirmed link button */}
              <button
                type="button"
                onClick={checkVerificationStatus}
                disabled={checkingStatus}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {checkingStatus ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span>I Already Confirmed in Email</span>
              </button>

              {/* Resend button */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : 'Resend verification email'}
                  </span>
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <Link href="/login" className="hover:text-blue-600 font-medium">
              Back to Sign In
            </Link>
            <Link href="/register" className="hover:text-blue-600 font-medium">
              Register another account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

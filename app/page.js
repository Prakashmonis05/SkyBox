import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OnlineClipboard from '@/components/OnlineClipboard';
import {
  ArrowRight,
  Sparkles,
  Share2,
  HardDrive,
  FileText,
  ShieldCheck,
  Check,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* HERO SECTION WITH NATIVE INTEGRATED CLIPBOARD */}
        <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center justify-center py-6 sm:py-8 lg:py-8">
          {/* Subtle ambient background glow */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(59,130,246,0.08),rgba(255,255,255,0))]" />

          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              
              {/* Online Clipboard: FIRST ON MOBILE (order-1), SECOND ON DESKTOP (lg:order-2) */}
              <div className="order-1 lg:order-2 lg:col-span-7 w-full max-w-lg mx-auto lg:max-w-none">
                <OnlineClipboard compact={false} showCloudVault={false} />
              </div>

              {/* Headline, CTAs, Highlights: SECOND ON MOBILE (order-2), FIRST ON DESKTOP (lg:order-1) */}
              <div className="order-2 lg:order-1 lg:col-span-5 space-y-4 sm:space-y-5 text-center lg:text-left pt-6 lg:pt-0 border-t border-slate-200/70 lg:border-t-0">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Instant Share • Zero Login Required</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.14]">
                  Your files.<br />
                  Instant clipboard.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    Anywhere.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed font-normal max-w-md mx-auto lg:mx-0">
                  Drop text, code, or files for an instant 6-digit share code. Or access your private cloud vault for permanent storage and nested folders.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 pt-1">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <span>Open Cloud Vault</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
                  >
                    <span>Sign In</span>
                  </Link>
                </div>

                {/* Quick Trust Highlights */}
                <div className="pt-2 flex flex-col gap-2 text-xs font-medium text-slate-500 max-w-sm mx-auto lg:mx-0 text-left">
                  <span className="flex items-center gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>6-digit codes self-destruct after 24 hours</span>
                  </span>
                  <span className="flex items-center gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>No sign-in or account needed for clipboard</span>
                  </span>
                  <span className="flex items-center gap-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Private cloud storage vault with nested folders</span>
                  </span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SIMPLIFIED HIGHLIGHTS */}
        <section id="features" className="py-10 sm:py-14 bg-white border-t border-slate-200/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-7 sm:mb-8 space-y-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Key Features
              </h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Everything you need, nothing you don&apos;t
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Feature 1 */}
              <div className="p-4.5 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3.5 shadow-2xs">
                  <Share2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  Instant Online Clipboard
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Share text, URLs, or files across phones and computers in seconds using a 6-digit code. Automatically cleaned up after 24 hours.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-4.5 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3.5 shadow-2xs">
                  <HardDrive className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  Private Cloud Vault
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Sign in to store files permanently. Create nested folders, star your favorites, and manage files with built-in trash protection.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-4.5 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3.5 shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  Built-in .txt Editor
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Draft and edit plain-text notes directly inside your browser. Automatically saved to your folders with zero third-party software.
                </p>
              </div>
            </div>

            {/* Bottom Security Assurance */}
            <div className="mt-8 sm:mt-10 p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-5 shadow-sm">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-emerald-400">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Row-Level Security & Encrypted Transfer</span>
                </div>
                <p className="text-xs text-slate-300 max-w-lg">
                  Every user vault is strictly isolated in PostgreSQL and protected with cryptographic security rules.
                </p>
              </div>

              <Link
                href="/register"
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
              >
                <span>Create Free Space</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

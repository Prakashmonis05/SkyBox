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
        <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center justify-center py-4 sm:py-6 lg:py-8">
          {/* Subtle ambient background glow */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(59,130,246,0.08),rgba(255,255,255,0))]" />

          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
              
              {/* Left Column: Headline, CTAs, Highlights */}
              <div className="lg:col-span-5 space-y-4 lg:space-y-4 text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Instant Share • Zero Login Required</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                  Your files.<br />
                  Instant clipboard.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    Anywhere.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed font-normal max-w-md mx-auto lg:mx-0">
                  Drop text, code, or files on the right for an instant 6-digit share code. Or access your private cloud vault for permanent storage and nested folders.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-0.5">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition cursor-pointer"
                  >
                    <span>Open Cloud Vault</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm shadow-2xs transition cursor-pointer"
                  >
                    <span>Sign In</span>
                  </Link>
                </div>

                {/* Quick Trust Highlights */}
                <div className="pt-1 flex flex-col sm:flex-row lg:flex-col gap-1.5 text-xs font-medium text-slate-500 justify-center lg:justify-start">
                  <span className="flex items-center gap-2 justify-center lg:justify-start">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>6-digit codes self-destruct after 24 hours</span>
                  </span>
                  <span className="flex items-center gap-2 justify-center lg:justify-start">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>No sign-in or account needed for clipboard</span>
                  </span>
                  <span className="flex items-center gap-2 justify-center lg:justify-start">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Private cloud storage vault with nested folders</span>
                  </span>
                </div>
              </div>

              {/* Right Column: Online Clipboard fitted into the view */}
              <div className="lg:col-span-7 w-full max-w-xl mx-auto lg:max-w-none">
                <OnlineClipboard compact={false} showCloudVault={false} />
              </div>

            </div>
          </div>
        </section>

        {/* SIMPLIFIED HIGHLIGHTS */}
        <section id="features" className="py-12 bg-white border-t border-slate-200/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-8 space-y-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Key Features
              </h2>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Everything you need, nothing you don&apos;t
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-sm transition">
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
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-sm transition">
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
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-sm transition">
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
            <div className="mt-10 p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Row-Level Security & Encrypted Transfer</span>
                </div>
                <p className="text-xs text-slate-300 max-w-lg">
                  Every user vault is strictly isolated in PostgreSQL and protected with cryptographic security rules.
                </p>
              </div>

              <Link
                href="/register"
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition"
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

import Link from 'next/link';
import Image from 'next/image';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <Image
                  src="/logo.png"
                  alt="SkyBox Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Sky<span className="text-blue-600">Box</span>
              </span>
            </Link>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              Fast online clipboard and private personal cloud vault. Share snippets with a 6-digit code or organize files permanently with encrypted security.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Row-Level Security & Private Cloud Storage</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Tools
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#clipboard" className="hover:text-blue-600 transition">
                  Online Clipboard
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-blue-600 transition">
                  Vault Features
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-blue-600 transition">
                  Cloud Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Account
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/login" className="hover:text-blue-600 transition">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-blue-600 transition">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/forgot-password" className="hover:text-blue-600 transition">
                  Reset Password
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 SkyBox. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with Next.js, Tailwind CSS & Supabase.
          </p>
        </div>
      </div>
    </footer>
  );
}

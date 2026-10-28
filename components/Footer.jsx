import Link from 'next/link';
import { Cloud, Shield, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                <Cloud className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Sky<span className="text-blue-600">Box</span>
              </span>
            </Link>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              Your files. Your space. Anywhere. SkyBox provides private, high-speed, and secure cloud storage with native hierarchical folders and integrated plain-text note creation.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Row-Level Security & Private Cloud Storage</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li>
                <a href="#features" className="hover:text-blue-600 transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-blue-600 transition">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-blue-600 transition">
                  Security Architecture
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-blue-600 transition">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
              Account
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
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

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 SkyBox Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with Next.js, Tailwind CSS & Supabase.
          </p>
        </div>
      </div>
    </footer>
  );
}

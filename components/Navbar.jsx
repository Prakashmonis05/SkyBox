import Link from 'next/link';
import { Cloud, ArrowRight } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
            <Cloud className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-none">
              Sky<span className="text-blue-600">Box</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-0.5">
              Cloud Storage & Clipboard
            </span>
          </div>
        </Link>

        {/* Action Buttons: Desktop & tablet only (hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3.5 py-2 rounded-xl transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] px-4 py-2 rounded-xl shadow-sm shadow-blue-500/20 transition cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

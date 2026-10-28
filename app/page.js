import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Cloud,
  FolderPlus,
  FileText,
  UploadCloud,
  ShieldCheck,
  Star,
  Trash2,
  ArrowRight,
  Sparkles,
  HardDrive,
  FileCode,
  CheckCircle,
  Lock,
  Layers,
  Smartphone,
  Check
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Cloud Storage Platform</span>
              </div>

              {/* Tagline & Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Your files. Your space.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Anywhere.
                </span>
              </h1>

              {/* Short Description */}
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
                SkyBox gives you a private, modern cloud workspace. Upload files in any format, organize with infinite subfolders, and create or edit plain-text notes on the fly from any browser.
              </p>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 shadow-md shadow-blue-500/25 transition cursor-pointer"
                >
                  <span>Get Started for Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-base border border-slate-200 hover:bg-slate-100 hover:border-slate-300 shadow-xs transition cursor-pointer"
                >
                  <span>Sign In to Dashboard</span>
                </Link>
              </div>

              {/* Trust highlights */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-blue-600" /> Private PostgreSQL Vault
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-blue-600" /> Supabase Row-Level Security
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-blue-600" /> Fast Text Editor (.txt)
                </span>
              </div>
            </div>

            {/* PRODUCT PREVIEW SHOWCASE */}
            <div className="mt-14 max-w-5xl mx-auto">
              <div className="relative rounded-2xl bg-white p-3 sm:p-5 shadow-xl shadow-slate-200/60 border border-slate-200/90 overflow-hidden">
                {/* Mock Window Top Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="ml-3 text-xs font-semibold text-slate-600">
                      SkyBox — Personal Cloud Storage
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Lock className="w-3.5 h-3.5 text-green-600" />
                    <span>Encrypted & Private</span>
                  </div>
                </div>

                {/* Mock Dashboard Body */}
                <div className="pt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Mock Sidebar */}
                  <div className="hidden md:block col-span-1 space-y-1.5 border-r border-slate-100 pr-4">
                    <div className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs flex items-center gap-2.5">
                      <HardDrive className="w-4 h-4" />
                      <span>Home Overview</span>
                    </div>
                    <div className="px-3 py-2 rounded-lg text-slate-600 text-xs flex items-center gap-2.5 hover:bg-slate-50">
                      <FolderPlus className="w-4 h-4" />
                      <span>My Files</span>
                    </div>
                    <div className="px-3 py-2 rounded-lg text-slate-600 text-xs flex items-center gap-2.5 hover:bg-slate-50">
                      <Star className="w-4 h-4" />
                      <span>Starred</span>
                    </div>
                    <div className="px-3 py-2 rounded-lg text-slate-600 text-xs flex items-center gap-2.5 hover:bg-slate-50">
                      <Trash2 className="w-4 h-4" />
                      <span>Trash</span>
                    </div>

                    <div className="pt-6">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-600 space-y-2">
                        <div className="flex justify-between font-semibold">
                          <span>Vault Usage</span>
                          <span className="text-blue-600">2.4 MB / 1 GB</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full w-[25%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mock Main Content */}
                  <div className="col-span-1 md:col-span-3 space-y-4">
                    {/* Mock Quick Action row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-xs font-semibold text-slate-700">
                        Quick Storage Directory
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-[11px] font-medium bg-blue-600 text-white rounded-lg flex items-center gap-1 shadow-xs">
                          <UploadCloud className="w-3.5 h-3.5" /> Upload File
                        </span>
                        <span className="px-2.5 py-1 text-[11px] font-medium bg-white text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-600" /> New .txt
                        </span>
                      </div>
                    </div>

                    {/* Mock Folders & Files Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition shadow-xs flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <FolderPlus className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">Semester Notes</div>
                          <div className="text-[10px] text-slate-500">4 items</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition shadow-xs flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">DBMS Notes.txt</div>
                          <div className="text-[10px] text-slate-500">12 KB • Plain Text</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition shadow-xs flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">Project Spec.pdf</div>
                          <div className="text-[10px] text-slate-500">1.2 MB • PDF</div>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Text Editor Teaser */}
                    <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="flex items-center gap-1.5 font-mono text-blue-400 font-semibold">
                          <FileText className="w-3.5 h-3.5" /> Built-in .txt Editor
                        </span>
                        <span className="bg-slate-800 text-[10px] px-2 py-0.5 rounded text-emerald-400 font-medium">
                          Auto-saved to Storage
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                        // Create and edit plain-text notes instantly without leaving your cloud storage vault.<br />
                        File: DBMS Notes.txt | Saved in: My Files → MCA → Notes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-20 bg-white border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Core Capabilities
              </h2>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Engineered for speed, privacy, and simplicity
              </h3>
              <p className="text-base text-slate-600">
                Everything you need to store, write, and organize your files without the bloat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-sm shadow-blue-500/20">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">
                  Universal File Upload
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Upload documents, images, audio, video, PDFs, and ZIPs with single or multi-file picker and progress monitoring.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-sm shadow-blue-500/20">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">
                  Nested Folders & Breadcrumbs
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Build any directory tree with nested subfolders. Interactive breadcrumb navigation lets you jump directly between parent directories.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-sm shadow-blue-500/20">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">
                  Integrated .txt Note Editor
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Type or paste notes right from the browser. Saves as genuine `.txt` files directly inside your current folder in Supabase Storage.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-sm shadow-blue-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">
                  Row-Level Security (RLS)
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Every folder, file metadata, and storage object is cryptographically bound to your user ID. Cross-user data leakage is strictly impossible.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-sm shadow-blue-500/20">
                  <Star className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">
                  Starred & Recent Activity
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Favorite critical files and access them instantly. The Recent view tracks your latest modifications for seamless workflow continuity.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-5 shadow-sm shadow-blue-500/20">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">
                  Safety Trash & Instant Recovery
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Deleted files move to Trash first with full restoration support. Permanently purge items or empty trash only when you are completely ready.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Simple Workflow
              </h2>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                How SkyBox works in 3 easy steps
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs relative">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-lg flex items-center justify-center mb-6">
                  1
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  Create Your Free Space
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Register with your email and password or authenticate in one click via Google OAuth. Your isolated vault is created instantly.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs relative">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-lg flex items-center justify-center mb-6">
                  2
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  Organize & Author Files
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Upload files directly into target folders or open the built-in text editor to create notes. Everything is synchronized to PostgreSQL & Storage.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs relative">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-bold text-lg flex items-center justify-center mb-6">
                  3
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">
                  Access & Download Anywhere
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Sign in from any laptop, tablet, or smartphone. Search by name, preview documents, and download files with real-time speed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY ARCHITECTURE SECTION */}
        <section id="security" className="py-20 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 sm:p-12 text-white shadow-xl">
              <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
                    <ShieldCheck className="w-4 h-4" /> Enterprise-Grade Privacy
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Your personal space is mathematically private
                  </h3>
                  <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                    SkyBox enforces Row Level Security at the database level and authenticated storage policies. One user can never query, read, update, or download another user&apos;s data.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300 font-mono">
                    <span className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                      ✓ Supabase Auth JWT
                    </span>
                    <span className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                      ✓ auth.uid() Isolation
                    </span>
                    <span className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                      ✓ Encrypted File Transfer
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 shadow-md shadow-blue-500/30 transition cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

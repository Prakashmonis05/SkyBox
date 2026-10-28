# SkyBox — Personal Cloud Storage

**Tagline:** *Your files. Your space. Anywhere.*

SkyBox is a modern, secure, and responsive personal cloud storage web application built with Next.js App Router, Tailwind CSS, and Supabase.

---

## 🌟 Key Features

1. **Authentication & Multi-Tenant Isolation**
   - User registration & login with email/password.
   - Google OAuth one-click authentication.
   - Password reset via secure email links.
   - Session management and route protection via Next.js Middleware.
   - Zero-trust architecture: Supabase Row Level Security (RLS) ensures one user can never access another user's files or folders.

2. **Hierarchical Folder Management**
   - Create folders and unlimited nested subfolders using `parent_id`.
   - Dynamic breadcrumb navigation (`My Files → MCA → Semester 1 → DBMS`).
   - Rename folders, star/favorite folders, and move folders.
   - Cycle prevention: SQL function `is_valid_folder_move()` prevents moving a folder into itself or its descendants.

3. **Universal File Upload & Storage**
   - Single & multi-file upload with drag-and-drop support.
   - Progress indicators and per-file size validation (up to 50MB).
   - Supports PDFs, images, videos, audio, code, archives, and office documents.
   - Files stored in private Supabase Storage bucket `skybox-vault`.
   - Secure authenticated downloads and short-lived signed URLs.

4. **Integrated Plain-Text (.txt) Editor**
   - Create genuine `.txt` files directly in SkyBox.
   - Large, distraction-free note editor with filename customization.
   - Typing and pasting content with word/line counts.
   - Reopening and editing existing `.txt` files with in-place updates.
   - Live saving status and unsaved-changes protection warnings.

5. **File Organization, Search & Trash**
   - **Global Search:** 300ms debounced search querying across all files and folders.
   - **Recent Activity:** Tracks recently accessed and modified files.
   - **Starred Items:** Quick access to pinned folders and files.
   - **Trash Vault:** Soft-deletion mechanism with one-click restore and permanent purge.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** JavaScript (ES6+)
- **Styling:** Tailwind CSS v4
- **Authentication:** Supabase Auth (`@supabase/supabase-js`, `@supabase/ssr`)
- **Database:** Supabase PostgreSQL with Row Level Security (RLS)
- **File Storage:** Supabase Storage (`skybox-vault` private bucket)
- **Icons:** Lucide React
- **Deployment:** Vercel

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/skybox.git
cd skybox
npm install
```

### 2. Configure Environment Variables

Create `.env.local` by copying `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Setup Supabase Database & Storage

1. Go to your [Supabase Project Dashboard](https://supabase.com).
2. Open the **SQL Editor** and create a new query.
3. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   - This creates `public.profiles`, `public.folders`, and `public.files` tables.
   - Sets up triggers for auto-creating user profiles on signup.
   - Configures the `skybox-vault` private storage bucket.
   - Enforces strict Row Level Security (RLS) policies on both database tables and storage objects.

### 4. Configure Supabase Authentication Redirects

In Supabase Dashboard under **Authentication → URL Configuration**:
- **Site URL:**
  - Local: `http://localhost:3000`
  - Production: `https://your-domain.vercel.app`
- **Redirect URLs:**
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/reset-password`
  - `https://your-domain.vercel.app/auth/callback`

### 5. Run the Local Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deployment on Vercel

1. Push your repository to **GitHub**.
2. Go to [vercel.com](https://vercel.com) and click **Add New → Project**.
3. Import your `skybox` repository.
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (set to your Vercel deployment URL, e.g. `https://skybox.vercel.app`)
5. Click **Deploy**.
6. After deployment completes, copy your live Vercel URL and add it to your Supabase **Authentication → Redirect URLs**.

---

## 📄 License

MIT License. Built with Next.js & Supabase.

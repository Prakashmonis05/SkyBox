import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClientLayout from './DashboardClientLayout';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard — SkyBox',
  description: 'Your personal cloud space. Anywhere.',
};

export default async function DashboardLayout({ children }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder');

  let user = null;
  let profile = null;
  let initialUsedBytes = 0;

  if (!isPlaceholder) {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      redirect('/login');
    }

    user = authUser;

    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      profile = userProfile;

      // Fetch initial user storage usage directly on server
      const { data: userFiles } = await supabase
        .from('files')
        .select('size_bytes')
        .is('deleted_at', null);

      initialUsedBytes = (userFiles || []).reduce(
        (acc, curr) => acc + (Number(curr.size_bytes) || 0),
        0
      );
    } catch (error) {
      console.warn('Non-fatal error fetching dashboard profile/files on server:', error);
    }
  } else {
    // Development fallback when credentials are not yet configured
    user = {
      id: 'local-demo-user',
      email: 'demo@skybox.dev',
      user_metadata: { full_name: 'SkyBox Demo User' },
    };
    profile = {
      id: 'local-demo-user',
      full_name: 'SkyBox Demo User',
      avatar_url: null,
    };
  }

  return (
    <DashboardClientLayout
      user={user}
      profile={profile}
      initialUsedBytes={initialUsedBytes}
    >
      {children}
    </DashboardClientLayout>
  );
}

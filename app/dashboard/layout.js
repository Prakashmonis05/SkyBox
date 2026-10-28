import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClientLayout from './DashboardClientLayout';

export const metadata = {
  title: 'Dashboard — SkyBox',
  description: 'Your personal cloud space. Anywhere.',
};

export default async function DashboardLayout({ children }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder');

  let user = null;
  let profile = null;

  if (!isPlaceholder) {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        redirect('/login');
      }

      user = authUser;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      profile = userProfile;
    } catch (error) {
      console.error('Error fetching dashboard user:', error);
      // If error is NEXT_REDIRECT, rethrow it
      if (error?.digest?.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
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
    <DashboardClientLayout user={user} profile={profile}>
      {children}
    </DashboardClientLayout>
  );
}

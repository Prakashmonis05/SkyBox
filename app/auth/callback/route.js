import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const cleanNext = next.startsWith('/') ? next : `/${next}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto');

      // Check if this request is running on localhost/local network
      const isLocalHost =
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        (forwardedHost && (forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1')));

      if (isLocalHost) {
        // Never enforce HTTPS on localhost to prevent ERR_SSL_PROTOCOL_ERROR
        return NextResponse.redirect(`${origin}${cleanNext}`);
      }

      if (forwardedHost) {
        const proto = forwardedProto || 'https';
        return NextResponse.redirect(`${proto}://${forwardedHost}${cleanNext}`);
      }

      return NextResponse.redirect(`${origin}${cleanNext}`);
    }
  }

  // Return the user to an error page or login with error
  return NextResponse.redirect(`${origin}/login?error=Could%20not%20authenticate%20user`);
}

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Share code is required' }, { status: 400 });
  }

  const cleanCode = code.trim().toUpperCase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  // Demo fallback
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return NextResponse.json({
      demo: true,
      message: 'Demo mode active. Downloads operate directly in browser.',
    });
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    });

    const nowIso = new Date().toISOString();
    const { data: clip, error } = await supabase
      .from('shared_clips')
      .select('*')
      .ilike('share_code', cleanCode)
      .gt('expires_at', nowIso)
      .single();

    if (error || !clip) {
      return NextResponse.json(
        { error: 'Share code is invalid or has expired.' },
        { status: 404 }
      );
    }

    // Increment download count
    await supabase
      .from('shared_clips')
      .update({ download_count: (clip.download_count || 0) + 1 })
      .eq('id', clip.id);

    // If it's a cloud storage file
    if (clip.is_cloud_file && clip.storage_path) {
      const { data: signedData, error: signError } = await supabase.storage
        .from('skybox-vault')
        .createSignedUrl(clip.storage_path, 300, {
          download: clip.file_name || 'download',
        });

      if (signError || !signedData?.signedUrl) {
        // Fallback: try direct download stream
        const { data: fileBlob, error: downloadError } = await supabase.storage
          .from('skybox-vault')
          .download(clip.storage_path);

        if (downloadError) {
          return NextResponse.json({ error: 'Failed to access file.' }, { status: 500 });
        }

        return new Response(fileBlob, {
          headers: {
            'Content-Type': clip.mime_type || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(
              clip.file_name || 'file'
            )}"`,
          },
        });
      }

      return NextResponse.redirect(signedData.signedUrl);
    }

    // If it's a text/code snippet
    const content = clip.content || '';
    const filename = clip.file_name || `${clip.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (err) {
    console.error('Download route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import cloudinary, { isCloudinaryConfigured } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

function extractPublicIdFromUrl(url) {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) return null;

    // Everything after upload (and optional version like v123456789)
    const afterUpload = pathParts.slice(uploadIndex + 1);
    if (afterUpload[0]?.startsWith('v') && /^\d+$/.test(afterUpload[0].slice(1))) {
      afterUpload.shift();
    }
    const fullPath = afterUpload.join('/');
    return fullPath.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ success: true, warning: 'Cloudinary not configured' });
    }

    const { public_id, url, resource_type = 'raw' } = await request.json();
    const targetId = public_id || (url ? extractPublicIdFromUrl(url) : null);

    if (!targetId) {
      return NextResponse.json({ error: 'No valid public_id or url provided' }, { status: 400 });
    }

    // Try destroying as specified resource_type, fallback to image/raw
    let result = await cloudinary.uploader.destroy(targetId, {
      resource_type: resource_type,
    });

    if (result.result !== 'ok' && resource_type === 'raw') {
      result = await cloudinary.uploader.destroy(targetId, {
        resource_type: 'image',
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Cloudinary destroy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete file from Cloudinary' },
      { status: 500 }
    );
  }
}


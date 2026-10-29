import { NextResponse } from 'next/server';
import cloudinary, { isCloudinaryConfigured } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            'Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env.local file.',
          missingConfig: true,
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No valid file provided for upload.' },
        { status: 400 }
      );
    }

    // Determine resource type: 'image' | 'video' | 'raw'
    const mime = file.type || '';
    let resourceType = 'raw';

    if (mime.startsWith('image/')) {
      resourceType = 'image';
    } else if (mime.startsWith('video/') || mime.startsWith('audio/')) {
      resourceType = 'video';
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeName = (file.name || 'file')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.[^/.]+$/, ''); // Remove extension from public_id to let Cloudinary manage formats
    const publicId = `${Date.now()}_${safeName}`;

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'skybox/vault',
          public_id: publicId,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      bytes: uploadResult.bytes || buffer.length,
      format: uploadResult.format,
      resource_type: uploadResult.resource_type,
      provider: 'cloudinary',
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to upload file to Cloudinary.',
      },
      { status: 500 }
    );
  }
}


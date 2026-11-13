import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { requireAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Image file is required.' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are accepted.' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be smaller than 10 MB.' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error:
            'Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.',
        },
        { status: 500 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const uploaded = await new Promise<{ secure_url?: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'pure-khetar/products',
            resource_type: 'image',
            transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
          },
          (error, result) => (error ? reject(error) : resolve(result ?? {})),
        )
        .end(buffer);
    });

    if (!uploaded.secure_url) {
      return NextResponse.json({ error: 'Cloudinary did not return an image URL.' }, { status: 502 });
    }

    return NextResponse.json({ url: uploaded.secure_url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image upload failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
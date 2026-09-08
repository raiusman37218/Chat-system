import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

// Allowed MIME types: images and standard documents
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
  'application/pdf',
  'text/plain',
]);

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum 15MB limit' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not permitted. Supported: images, PDF, and TXT.` },
        { status: 400 }
      );
    }

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            'Cloudinary credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_URL) in your .env.local file.',
        },
        { status: 503 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isImage = file.type.startsWith('image/');
    const result = await uploadToCloudinary(buffer, {
      folder: 'chat_attachments',
      filename: file.name,
      resourceType: isImage ? 'image' : 'auto',
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      filename: file.name,
      size: result.bytes || file.size,
      mimeType: file.type,
      isImage,
      width: result.width,
      height: result.height,
    });
  } catch (error: any) {
    console.error('[Upload API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'File upload failed' },
      { status: 500 }
    );
  }
}

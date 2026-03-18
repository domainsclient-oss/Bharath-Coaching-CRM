import { NextRequest, NextResponse } from 'next/server';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

// Firebase Admin SDK is not available in Next.js API routes by default.
// We use the client SDK via a dynamic import workaround.
// The actual Firestore writes happen client-side via the /setup page.
// This API route only handles the file system lock check and removal.

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const lockFilePath = join(process.cwd(), 'setup.lock');

    if (!existsSync(lockFilePath)) {
      return NextResponse.json(
        { success: false, error: 'Setup has already been completed or setup.lock file is missing.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'complete') {
      // Delete the lock file to prevent future setup runs
      unlinkSync(lockFilePath);
      return NextResponse.json({ success: true, message: 'Setup completed. Lock file removed.' });
    }

    if (action === 'check') {
      return NextResponse.json({ success: true, available: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Setup API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const lockFilePath = join(process.cwd(), 'setup.lock');
    const available = existsSync(lockFilePath);
    return NextResponse.json({ available });
  } catch {
    return NextResponse.json({ available: false });
  }
}

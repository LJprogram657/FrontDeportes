import { NextResponse } from 'next/server';
import { requireAuth } from '@/src/lib/auth';

export async function GET(req: Request) {
  const user = await requireAuth(req as any);
  if (!user) return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });

  return NextResponse.json(
    { success: true, message: 'Token válido', user_id: user.id, email: user.email },
    { status: 200 }
  );
}
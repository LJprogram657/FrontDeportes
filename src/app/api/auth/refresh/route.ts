import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAccessToken, verifyRefreshToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { refresh } = await req.json();
    if (!refresh) return NextResponse.json({ success: false, message: 'Refresh token requerido' }, { status: 400 });

    const decoded = verifyRefreshToken(refresh);
    if (!decoded?.sub) return NextResponse.json({ success: false, message: 'Refresh inválido' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: Number(decoded.sub) } });
    if (!user || !user.isActive || !user.isAdmin) {
      return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });
    }

    const access = signAccessToken({ sub: user.id, email: user.email, isAdmin: user.isAdmin });
    return NextResponse.json({ success: true, access }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Error de refresco' }, { status: 500 });
  }
}
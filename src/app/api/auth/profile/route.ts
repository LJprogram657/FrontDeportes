import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireAuth(req as any);
  if (!user) return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });

  return NextResponse.json(
    { success: true, user: { id: user.id, username: user.email, email: user.email, is_admin: user.isAdmin } },
    { status: 200 }
  );
}

export async function PUT(req: Request) {
  const authed = await requireAuth(req as any);
  if (!authed) return NextResponse.json({ success: false, message: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  const data: any = {};
  if (body.first_name !== undefined) data.firstName = body.first_name;
  if (body.last_name !== undefined) data.lastName = body.last_name;
  if (body.password) data.password = await hashPassword(body.password);

  const updated = await prisma.user.update({ where: { id: authed.id }, data });
  return NextResponse.json(
    {
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: { id: updated.id, username: updated.email, email: updated.email, is_admin: updated.isAdmin },
    },
    { status: 200 }
  );
}
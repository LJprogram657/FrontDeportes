import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = Number(params.id);
  const { status } = await req.json();
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
  }
  const team = await prisma.team.update({ where: { id }, data: { status } });
  return NextResponse.json(team, { status: 200 });
}
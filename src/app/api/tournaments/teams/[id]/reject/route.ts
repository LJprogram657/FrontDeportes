import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/auth';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(_ as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = Number(params.id);
  await prisma.team.update({ where: { id }, data: { status: 'rejected' } });
  return NextResponse.json({ status: 'team rejected' }, { status: 200 });
}
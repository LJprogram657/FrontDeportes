import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  const admin = await requireAdmin(_ as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = Number(params.id);
  await prisma.team.update({ where: { id }, data: { status: 'approved' } });
  return NextResponse.json({ status: 'team approved' }, { status: 200 });
}
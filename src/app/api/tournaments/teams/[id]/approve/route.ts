import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = Number(params.id);
  const team = await prisma.team.update({
    where: { id },
    data: { status: 'approved' },
    include: { players: true },
  });
  return NextResponse.json(team, { status: 200 });
}
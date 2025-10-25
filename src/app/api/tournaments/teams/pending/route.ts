import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/auth';

export async function GET(req: Request) {
  const user = await requireAuth(req as any);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const teams = await prisma.team.findMany({
    where: { status: 'pending' },
    include: { players: true, tournament: { select: { id: true, name: true, code: true, logo: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(teams, { status: 200 });
}
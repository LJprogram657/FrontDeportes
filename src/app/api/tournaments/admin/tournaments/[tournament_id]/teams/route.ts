import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = await requireAdmin(_ as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const tournamentId = Number(params.tournament_id);
  const teams = await prisma.team.findMany({
    where: { tournamentId },
    include: { players: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(teams, { status: 200 });
}
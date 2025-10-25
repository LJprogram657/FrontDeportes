import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/auth';

export async function GET(_: Request, { params }: { params: { tournament_id: string } }) {
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
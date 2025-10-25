import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/auth';

export async function GET(req: Request) {
  const admin = await requireAdmin(req as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status');
  const tournamentFilter = url.searchParams.get('tournament');

  const teams = await prisma.team.findMany({
    where: {
      status: statusFilter ? (statusFilter as any) : undefined,
      tournamentId: tournamentFilter ? Number(tournamentFilter) : undefined,
    },
    include: { players: true, tournament: { select: { id: true, name: true, code: true, logo: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(teams, { status: 200 });
}
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/auth';

export async function GET(req: Request) {
  const admin = await requireAdmin(req as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const stats = {
    total_tournaments: await prisma.tournament.count(),
    active_tournaments: await prisma.tournament.count({ where: { status: 'active' } }),
    total_teams: await prisma.team.count(),
    pending_teams: await prisma.team.count({ where: { status: 'pending' } }),
    approved_teams: await prisma.team.count({ where: { status: 'approved' } }),
    total_players: await prisma.player.count(),
    recent_registrations: await prisma.team.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
  };
  return NextResponse.json(stats, { status: 200 });
}
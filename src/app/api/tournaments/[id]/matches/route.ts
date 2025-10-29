import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const tournamentId = Number(params.id);
  const matches = await prisma.match.findMany({
    where: { tournamentId },
    orderBy: { createdAt: 'desc' },
    include: {
      homeTeam: { select: { id: true, name: true, logo: true } },
      awayTeam: { select: { id: true, name: true, logo: true } },
    },
  });
  return NextResponse.json(matches, { status: 200 });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const tournamentId = Number(params.id);
  const body = await req.json();

  const created = await prisma.match.create({
    data: {
      tournamentId,
      phase: body.phase,
      venue: body.venue ?? null,
      date: body.date ? new Date(body.date) : null,
      time: body.time ?? null,
      round: body.round ?? null,
      group: body.group ?? null,
      homeTeamId: body.homeTeamId ?? null,
      awayTeamId: body.awayTeamId ?? null,
      status: 'scheduled',
    },
    include: {
      homeTeam: { select: { id: true, name: true, logo: true } },
      awayTeam: { select: { id: true, name: true, logo: true } },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
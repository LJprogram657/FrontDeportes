import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = Number(params.id);
  const body = await req.json();

  const updated = await prisma.match.update({
    where: { id },
    data: {
      homeScore: body.homeScore ?? null,
      awayScore: body.awayScore ?? null,
      goals: body.goals ?? null,
      fouls: body.fouls ?? null,
      status: body.status ?? 'finished',
      venue: body.venue ?? undefined,
      date: body.date ? new Date(body.date) : undefined,
      time: body.time ?? undefined,
      round: body.round ?? undefined,
      group: body.group ?? undefined,
      homeTeamId: body.homeTeamId ?? undefined,
      awayTeamId: body.awayTeamId ?? undefined,
    },
    include: {
      homeTeam: { select: { id: true, name: true, logo: true } },
      awayTeam: { select: { id: true, name: true, logo: true } },
    },
  });

  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = Number(params.id);
  await prisma.match.delete({ where: { id } });
  return NextResponse.json({ message: 'Partido eliminado' }, { status: 200 });
}
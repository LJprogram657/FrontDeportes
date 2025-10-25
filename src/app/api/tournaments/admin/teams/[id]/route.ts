import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/auth';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(_ as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = Number(params.id);
  const team = await prisma.team.findUnique({
    where: { id },
    include: { players: true, tournament: { select: { id: true, name: true, code: true, logo: true } } },
  });
  if (!team) return NextResponse.json({}, { status: 404 });

  return NextResponse.json({ team, players: team.players }, { status: 200 });
}
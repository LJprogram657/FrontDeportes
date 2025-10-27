import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { teams: { include: { players: true } } },
  });
  if (!tournament) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });

  return NextResponse.json(tournament, { status: 200 });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = Number(params.id);

  // Borrado en orden por restricciones FK (RESTRICT)
  await prisma.$transaction([
    prisma.player.deleteMany({ where: { team: { tournamentId: id } } }),
    prisma.team.deleteMany({ where: { tournamentId: id } }),
    prisma.tournament.delete({ where: { id } }),
  ]);

  return NextResponse.json({ message: 'Torneo eliminado' }, { status: 200 });
}
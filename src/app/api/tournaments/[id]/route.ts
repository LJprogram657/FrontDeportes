import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { teams: { include: { players: true } } },
  });
  if (!tournament) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });

  return NextResponse.json(tournament, { status: 200 });
}
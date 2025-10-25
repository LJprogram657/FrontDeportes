import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const id = Number(params.id);
  const teams = await prisma.team.findMany({
    where: { tournamentId: id, status: 'approved' },
    select: {
      id: true, name: true, logo: true, contactPerson: true, contactNumber: true, status: true,
      players: { select: { id: true, name: true, lastName: true, cedula: true, photo: true } },
    },
  });
  return NextResponse.json(teams, { status: 200 });
}
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const t = await prisma.tournament.findUnique({ where: { id } });
  if (!t) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });

  return NextResponse.json({
    id: t.id,
    name: t.name,
    code: t.code,
    category: t.category,
    logo: t.logo,
    status: t.status,
    description: t.description,
    start_date: t.startDate,
    end_date: t.endDate,
    registration_deadline: t.registrationDeadline,
    max_teams: t.maxTeams,
    format: t.format,
    location: t.location,
    prize_pool: t.prizePool,
  });
}
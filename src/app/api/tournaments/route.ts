import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/auth';

export async function GET() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, code: true, category: true, logo: true, status: true,
      startDate: true, registrationDeadline: true, maxTeams: true,
      _count: { select: { teams: true } },
    },
  });
  return NextResponse.json(
    tournaments.map(t => ({
      id: t.id,
      name: t.name,
      code: t.code,
      category: t.category,
      logo: t.logo,
      status: t.status,
      start_date: t.startDate,
      registration_deadline: t.registrationDeadline,
      max_teams: t.maxTeams,
      teams_count: t._count.teams,
      is_registration_open:
        (!!t.registrationDeadline ? new Date() <= new Date(t.registrationDeadline) : t.status === 'active') &&
        t.status === 'active',
    })),
    { status: 200 }
  );
}

export async function POST(req: Request) {
  const user = await requireAuth(req as any);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();
  try {
    const created = await prisma.tournament.create({
      data: {
        name: body.name,
        code: body.code,
        category: body.category,
        logo: body.logo ?? null,
        description: body.description ?? null,
        startDate: body.start_date ? new Date(body.start_date) : null,
        endDate: body.end_date ? new Date(body.end_date) : null,
        registrationDeadline: body.registration_deadline ? new Date(body.registration_deadline) : null,
        maxTeams: body.max_teams ?? 16,
        format: body.format ?? 'round_robin',
        location: body.location ?? null,
        prizePool: body.prize_pool ?? null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (String(e.message).includes('Unique constraint')) {
      return NextResponse.json({ error: 'Ya existe un torneo con este código.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear torneo' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category') as 'masculino' | 'femenino' | null;

  let where: any = { status: 'active' };
  if (category) where.category = category;

  const active = await prisma.tournament.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, code: true, category: true, logo: true, status: true,
      startDate: true, registrationDeadline: true, maxTeams: true,
      _count: { select: { teams: true } },
    },
  });

  return NextResponse.json(
    active.map(t => ({
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
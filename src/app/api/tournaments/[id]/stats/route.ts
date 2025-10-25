import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const t = await prisma.tournament.findUnique({
    where: { id },
    include: {
      _count: { select: { teams: true } },
      teams: { select: { status: true } },
    },
  });
  if (!t) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });

  const pending = t.teams.filter(s => s.status === 'pending').length;
  const approved = t.teams.filter(s => s.status === 'approved').length;
  const rejected = t.teams.filter(s => s.status === 'rejected').length;

  const isRegistrationOpen =
    (!!t.registrationDeadline ? new Date() <= new Date(t.registrationDeadline) : t.status === 'active') &&
    t.status === 'active';

  return NextResponse.json({
    tournament_info: {
      id: t.id, name: t.name, code: t.code, category: t.category, logo: t.logo, status: t.status,
      description: t.description, start_date: t.startDate, end_date: t.endDate,
      registration_deadline: t.registrationDeadline, max_teams: t.maxTeams, format: t.format,
      location: t.location, prize_pool: t.prizePool,
    },
    teams_registered: t._count.teams,
    teams_pending: pending,
    teams_approved: approved,
    teams_rejected: rejected,
    max_teams: t.maxTeams,
    is_full: t._count.teams >= t.maxTeams,
    is_registration_open: isRegistrationOpen,
    registration_deadline: t.registrationDeadline,
  });
}
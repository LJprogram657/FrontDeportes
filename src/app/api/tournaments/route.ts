import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, code: true, category: true, logo: true, status: true,
      startDate: true, registrationDeadline: true, maxTeams: true,
      _count: { select: { teams: true } },
      phases: { select: { type: true } },
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
      phases: (t.phases || []).map(p => p.type),
      is_registration_open:
        (!!t.registrationDeadline ? new Date() <= new Date(t.registrationDeadline) : t.status === 'active') &&
        t.status === 'active',
    })),
    { status: 200 }
  );
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await req.json();

  const name = String(body.name ?? '').trim();
  const category = body.category === 'femenino' ? 'femenino' : 'masculino';
  if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });

  const formatStr = String(body.format ?? 'round_robin').trim().toLowerCase();
  const format = ['round_robin', 'knockout', 'group_stage'].includes(formatStr) ? formatStr : 'round_robin';

  const statusStr = String(body.status ?? 'upcoming').trim().toLowerCase();
  const status = ['active', 'upcoming', 'finished'].includes(statusStr) ? statusStr : 'upcoming';

  const slug = name.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
  let code = String(body.code ?? `${slug}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`);

  try {
    const created = await prisma.tournament.create({
      data: {
        name,
        code,
        category: category as any,
        logo: body.logo ?? null,
        status: status as any,
        description: body.description ?? null,
        startDate: body.start_date ? new Date(body.start_date) : null,
        endDate: body.end_date ? new Date(body.end_date) : null,
        registrationDeadline: body.registration_deadline ? new Date(body.registration_deadline) : null,
        maxTeams: Number(body.max_teams ?? 16),
        format: format as any,
        location: body.location ?? null,
        prizePool: body.prize_pool ?? null,
      },
      select: {
        id: true, name: true, code: true, category: true, logo: true, status: true,
        startDate: true, registrationDeadline: true, maxTeams: true,
      },
    });

    // Crear fase inicial "Todos contra Todos"
    await prisma.phase.create({
      data: {
        name: 'Todos contra Todos',
        type: 'round_robin',
        order: 1,
        tournamentId: created.id,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    // Unicidad de code
    if (err?.code === 'P2002') {
      code = `${slug}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const retry = await prisma.tournament.create({
        data: {
          name,
          code,
          category: category as any,
          logo: body.logo ?? null,
          status: status as any,
          description: body.description ?? null,
          startDate: body.start_date ? new Date(body.start_date) : null,
          endDate: body.end_date ? new Date(body.end_date) : null,
          registrationDeadline: body.registration_deadline ? new Date(body.registration_deadline) : null,
          maxTeams: Number(body.max_teams ?? 16),
          format: format as any,
          location: body.location ?? null,
          prizePool: body.prize_pool ?? null,
        },
        select: {
          id: true, name: true, code: true, category: true, logo: true, status: true,
          startDate: true, registrationDeadline: true, maxTeams: true,
        },
      });
      return NextResponse.json(retry, { status: 201 });
    }
    console.error('Error creando torneo:', err);
    return NextResponse.json({ error: 'Error interno creando torneo', details: err?.message ?? String(err) }, { status: 500 });
  }
}
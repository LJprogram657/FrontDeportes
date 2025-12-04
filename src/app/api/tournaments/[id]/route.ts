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
    // Eliminar partidos del torneo
    prisma.match.deleteMany({ where: { tournamentId: id } }),
    // Eliminar standings que referencian equipos del torneo o fases del torneo
    prisma.groupStanding.deleteMany({
      where: {
        OR: [
          { team: { tournamentId: id } },
          { phase: { tournamentId: id } },
        ],
      },
    }),
    // Eliminar jugadores de equipos del torneo
    prisma.player.deleteMany({ where: { team: { tournamentId: id } } }),
    // Eliminar equipos del torneo
    prisma.team.deleteMany({ where: { tournamentId: id } }),
    // Eliminar fases del torneo (nuevo)
    prisma.phase.deleteMany({ where: { tournamentId: id } }),
    // Finalmente eliminar el torneo
    prisma.tournament.delete({ where: { id } }),
  ]);

  return NextResponse.json({ message: 'Torneo eliminado' }, { status: 200 });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request as any);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const id = Number(params.id);
  const body = await request.json();

  const statusStr = body.status ? String(body.status).toLowerCase() : null;
  if (statusStr && !['active', 'upcoming', 'finished'].includes(statusStr)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  const updated = await prisma.tournament.update({
    where: { id },
    data: {
      status: statusStr ? (statusStr as any) : undefined,
      registrationDeadline: body.registration_deadline ? new Date(body.registration_deadline) : undefined,
      startDate: body.start_date ? new Date(body.start_date) : undefined,
      endDate: body.end_date ? new Date(body.end_date) : undefined,
      logo: body.logo ?? undefined,
      description: body.description ?? undefined,
      maxTeams: body.max_teams ? Number(body.max_teams) : undefined,
      location: body.location ?? undefined,
      prizePool: body.prize_pool ?? undefined,
      format: body.format ? (String(body.format) as any) : undefined,
    },
    select: {
      id: true, name: true, code: true, category: true, logo: true, status: true,
      startDate: true, registrationDeadline: true, maxTeams: true,
    },
  });

  // NOTA: No actualizamos las fases aquí porque borraría el historial y datos de fases activas.
  // La gestión de fases se hace progresivamente con "Siguiente Fase".
  // Si se requiere guardar la "configuración" de fases futuras, se necesitaría un campo nuevo en Tournament.
  
  return NextResponse.json(updated, { status: 200 });
}
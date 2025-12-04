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
  try {
    const admin = await requireAdmin(request as any);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const id = Number(params.id);

    // Borrado en orden por restricciones FK (RESTRICT)
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar partidos del torneo
      await tx.match.deleteMany({ where: { tournamentId: id } });

      // 2. Eliminar standings. Los standings dependen de Phase y Team.
      // Borramos todos los standings asociados a las fases de este torneo.
      await tx.groupStanding.deleteMany({
        where: {
          phase: { tournamentId: id }
        },
      });
      // Por seguridad, también intentamos borrar cualquier standing huérfano asociado a equipos de este torneo
      // (aunque teóricamente el paso anterior debería haberlos cubierto si la integridad es correcta)
      await tx.groupStanding.deleteMany({
        where: {
          team: { tournamentId: id }
        }
      });

      // 3. Eliminar jugadores de equipos del torneo
      await tx.player.deleteMany({ where: { team: { tournamentId: id } } });

      // 4. Eliminar equipos del torneo
      await tx.team.deleteMany({ where: { tournamentId: id } });

      // 5. Eliminar fases del torneo
      await tx.phase.deleteMany({ where: { tournamentId: id } });

      // 6. Finalmente eliminar el torneo
      await tx.tournament.delete({ where: { id } });
    });

    return NextResponse.json({ message: 'Torneo eliminado correctamente' }, { status: 200 });
  } catch (error: any) {
    console.error('Error eliminando torneo:', error);
    return NextResponse.json(
      { error: 'Error eliminando el torneo', details: error.message },
      { status: 500 }
    );
  }
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
      // Guardar configuración de fases y grupos
      selectedPhases: body.phases ? body.phases : undefined,
      groupCount: body.group_count ? Number(body.group_count) : undefined,
    },
    select: {
      id: true, name: true, code: true, category: true, logo: true, status: true,
      startDate: true, registrationDeadline: true, maxTeams: true,
      selectedPhases: true, groupCount: true,
    },
  });

  // NOTA: No actualizamos las fases activas (modelo Phase) aquí porque borraría el historial.
  // La gestión de fases activas se hace con "Siguiente Fase".
  // selectedPhases guarda la "intención" o configuración deseada.
  
  return NextResponse.json(updated, { status: 200 });
}
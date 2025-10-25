import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json();
  const tournamentId = Number(body.tournament);
  if (!tournamentId) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });

  const t = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!t) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });

  const isRegistrationOpen =
    (!!t.registrationDeadline ? new Date() <= new Date(t.registrationDeadline) : t.status === 'active') &&
    t.status === 'active';
  if (!isRegistrationOpen) return NextResponse.json({ error: 'El registro para este torneo está cerrado' }, { status: 400 });

  const count = await prisma.team.count({ where: { tournamentId } });
  if (count >= (t.maxTeams ?? 16)) {
    return NextResponse.json({ error: 'El torneo ha alcanzado el máximo de equipos permitidos' }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: {
      name: body.name,
      logo: body.logo ?? null,
      tournamentId,
      contactPerson: body.contact_person,
      contactNumber: body.contact_number,
      status: 'pending',
      players: {
        create: (Array.isArray(body.players) ? body.players : []).map((p: any) => ({
          name: p.name,
          lastName: p.lastName,
          cedula: p.cedula,
          photo: p.photo ?? null,
        })),
      },
    },
    include: { players: true },
  });

  return NextResponse.json(
    { message: 'Equipo registrado exitosamente. Pendiente de aprobación.', team },
    { status: 201 }
  );
}
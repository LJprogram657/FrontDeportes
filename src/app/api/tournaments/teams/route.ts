import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(req: Request) {
  const body = await req.json();
  const tournamentId = Number(body.tournament);
  if (!tournamentId) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 });

  // Validaciones básicas para evitar 500 por datos incompletos
  const name = (body.name ?? '').trim();
  const contactPerson = (body.contact_person ?? '').trim();
  const contactNumber = (body.contact_number ?? '').trim();
  if (!name || !contactPerson || !contactNumber) {
    return NextResponse.json(
      { error: 'Datos del equipo incompletos (nombre, contacto y número son requeridos)' },
      { status: 400 }
    );
  }

  // Buscar torneo y validar inscripción abierta
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

  // Normalizar y deduplicar jugadores por cédula para evitar P2002
  const playersInput = Array.isArray(body.players) ? body.players : [];
  const seenCedulas = new Set<string>();

  interface NormalizedPlayer {
    name: string;
    lastName: string;
    cedula: string;
    photo: string | null;
  }

  const players: NormalizedPlayer[] = playersInput
    .map((p: any): NormalizedPlayer => ({
      name: (p.name ?? '').trim(),
      lastName: (p.lastName ?? '').trim(),
      cedula: (p.cedula ?? '').trim(),
      photo: p.photo ?? null,
    }))
    .filter((p: NormalizedPlayer) => p.name && p.lastName && p.cedula) // filtra vacíos
    .filter((p: NormalizedPlayer) => {
      if (seenCedulas.has(p.cedula)) return false;
      seenCedulas.add(p.cedula);
      return true;
    });

  try {
    const team = await prisma.team.create({
      data: {
        name,
        logo: body.logo ?? null,
        tournamentId,
        contactPerson,
        contactNumber,
        status: 'pending',
        players: { create: players },
      },
      include: { players: true },
    });

    return NextResponse.json(
      { message: 'Equipo registrado exitosamente. Pendiente de aprobación.', team },
      { status: 201 }
    );
  } catch (err: any) {
    // Manejo fino de errores conocidos de Prisma
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return NextResponse.json(
          { error: 'Jugador duplicado: hay cédulas repetidas en el equipo' },
          { status: 400 }
        );
      }
      if (err.code === 'P2003') {
        return NextResponse.json(
          { error: 'Relación inválida: verifique el torneo seleccionado' },
          { status: 400 }
        );
      }
    }
    console.error('Error al crear equipo:', err);
    return NextResponse.json({ error: 'Error interno creando el equipo' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Método no permitido. Use POST para registrar equipos.' }, 
    { status: 405 }
  );
}
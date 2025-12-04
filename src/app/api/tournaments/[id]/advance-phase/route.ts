import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { PhaseType } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Verificar permisos de admin
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tournamentId = parseInt(params.id);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'ID de torneo inválido' }, { status: 400 });
    }

    // 2. Obtener fases actuales del torneo
    const phases = await prisma.phase.findMany({
      where: { tournamentId },
      orderBy: { order: 'asc' }
    });

    let nextPhaseType: PhaseType | null = null;
    let nextOrder = 1;

    // 3. Determinar siguiente fase
    if (phases.length === 0) {
      // Si no hay fases, iniciar con Fase de Grupos por defecto
      nextPhaseType = PhaseType.group_stage; 
    } else {
      const lastPhase = phases[phases.length - 1];
      nextOrder = lastPhase.order + 1;
      
      switch (lastPhase.type) {
        case PhaseType.round_robin:
          nextPhaseType = PhaseType.semifinals; 
          break;
        case PhaseType.group_stage:
          nextPhaseType = PhaseType.round_of_16;
          break;
        case PhaseType.round_of_16:
          nextPhaseType = PhaseType.quarterfinals;
          break;
        case PhaseType.quarterfinals:
          nextPhaseType = PhaseType.semifinals;
          break;
        case PhaseType.semifinals:
          nextPhaseType = PhaseType.final;
          break;
        case PhaseType.final:
          return NextResponse.json({ message: 'El torneo ya está en la final' }, { status: 400 });
        default:
          nextPhaseType = PhaseType.quarterfinals;
      }
    }

    if (nextPhaseType) {
      // Verificar si ya existe esa fase
      const existingPhase = await prisma.phase.findFirst({
        where: {
          tournamentId,
          type: nextPhaseType
        }
      });

      if (existingPhase) {
        // Si ya existe, retornamos la existente (idempotencia básica)
        return NextResponse.json(existingPhase);
      }

      const newPhase = await prisma.phase.create({
        data: {
          name: getPhaseName(nextPhaseType),
          type: nextPhaseType,
          order: nextOrder,
          tournamentId
        }
      });
      
      return NextResponse.json(newPhase);
    }

    return NextResponse.json({ error: 'No se pudo determinar la siguiente fase' }, { status: 400 });

  } catch (error) {
    console.error('Error advancing phase:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function getPhaseName(type: PhaseType): string {
  switch (type) {
    case PhaseType.group_stage: return 'Fase de Grupos';
    case PhaseType.round_robin: return 'Todos contra Todos';
    case PhaseType.round_of_16: return 'Octavos de Final';
    case PhaseType.quarterfinals: return 'Cuartos de Final';
    case PhaseType.semifinals: return 'Semifinales';
    case PhaseType.final: return 'Gran Final';
    default: return 'Nueva Fase';
  }
}

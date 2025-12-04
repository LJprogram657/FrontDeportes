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

    // Intentar leer el body por si se especifica una fase manual
    let manualNextPhase: PhaseType | null = null;
    try {
      const body = await request.json();
      if (body.nextPhase) {
        manualNextPhase = body.nextPhase as PhaseType;
      }
    } catch (e) {
      // Body vacío o inválido, ignorar
    }

    // 2. Obtener fases actuales del torneo
    const phases = await prisma.phase.findMany({
      where: { tournamentId },
      orderBy: { order: 'asc' }
    });

    let nextPhaseType: PhaseType | null = null;
    let nextOrder = 1;

    if (manualNextPhase) {
      nextPhaseType = manualNextPhase;
      nextOrder = phases.length > 0 ? phases[phases.length - 1].order + 1 : 1;
    } else {
      // 3. Determinar siguiente fase automáticamente
      if (phases.length === 0) {
        // Por defecto iniciar con Todos contra Todos si no hay nada, o Fase de Grupos
        // Dado el feedback, parece que prefieren un flujo largo.
        nextPhaseType = PhaseType.round_robin; 
      } else {
        const lastPhase = phases[phases.length - 1];
        nextOrder = lastPhase.order + 1;
        
        // Secuencia lineal completa sin saltos
        switch (lastPhase.type) {
          case PhaseType.round_robin:
            // De todos contra todos puede ir a grupos o directo a octavos/cuartos
            // Para máxima flexibilidad, vamos al siguiente paso lógico más granular
            nextPhaseType = PhaseType.group_stage; 
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
            // Si ya es final, permitir crear otra "Final" o "Ronda Extra" si se fuerza, 
            // pero por defecto retornamos error o simplemente no hacemos nada.
            // Para "sin restricciones", podríamos volver a round_robin (ciclo) o no hacer nada.
            // Vamos a permitirlo si el usuario lo pide explícitamente, pero automático paramos.
            return NextResponse.json({ error: 'El torneo ya finalizó sus fases estándar' }, { status: 400 });
          default:
            nextPhaseType = PhaseType.quarterfinals;
        }
      }
    }

    if (nextPhaseType) {
      // Verificar si ya existe esa fase EXACTA para evitar duplicados tontos
      // Pero si el usuario quiere avanzar, a veces quiere REPETIR una fase (ej: ida y vuelta separadas?)
      // Por ahora mantenemos la unicidad por tipo para evitar caos.
      const existingPhase = await prisma.phase.findFirst({
        where: {
          tournamentId,
          type: nextPhaseType
        }
      });

      if (existingPhase) {
        // Si ya existe, vamos a intentar saltar a la siguiente de la siguiente para no bloquear
        // Esto es recursivo simple
        const nextOfNext = getNextLogicalPhase(nextPhaseType);
        if (nextOfNext && nextOfNext !== nextPhaseType) {
             // Verificar si esa también existe... (podríamos hacer un bucle, pero con un salto basta por ahora)
             const existingNext = await prisma.phase.findFirst({
                where: { tournamentId, type: nextOfNext }
             });
             
             if (!existingNext) {
                 nextPhaseType = nextOfNext;
                 // Recalcular nombre
             } else {
                 return NextResponse.json({ error: `La fase ${nextPhaseType} y la siguiente ya existen` }, { status: 400 });
             }
        } else {
             return NextResponse.json({ error: `La fase ${nextPhaseType} ya existe en este torneo` }, { status: 400 });
        }
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

// Función auxiliar local para calcular siguiente fase (sin exportar)
function getNextLogicalPhase(current: PhaseType): PhaseType | null {
    switch (current) {
        case PhaseType.round_robin: return PhaseType.group_stage;
        case PhaseType.group_stage: return PhaseType.round_of_16;
        case PhaseType.round_of_16: return PhaseType.quarterfinals;
        case PhaseType.quarterfinals: return PhaseType.semifinals;
        case PhaseType.semifinals: return PhaseType.final;
        default: return null;
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


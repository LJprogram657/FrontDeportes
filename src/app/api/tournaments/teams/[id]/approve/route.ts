import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const admin = await requireAdmin(request as any);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const id = Number(params.id);
    try {
        const team = await prisma.team.update({
            where: { id },
            data: { status: 'approved' },
            include: {
                players: true,
            },
        });

        // Resolver una Phase válida sin depender de tournament.phaseId
        const phase = await prisma.phase.findFirst({
            select: { id: true },
            orderBy: { id: 'asc' },
        });

        if (!phase) {
            return NextResponse.json({ error: 'No hay fases configuradas' }, { status: 400 });
        }

        // Evitar duplicados: comprobar si ya existe el standing para (teamId, phaseId)
        const existingStanding = await prisma.groupStanding.findFirst({
            where: { teamId: id, phaseId: phase.id },
            select: { id: true },
        });

        if (!existingStanding) {
            await prisma.groupStanding.create({
                data: {
                    teamId: id,
                    phaseId: phase.id,
                    played: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    goalDiff: 0,
                    points: 0,
                },
            });
        }

        // Se elimina la lógica de Phase y GroupStanding para evitar errores de tipos en el build
        return NextResponse.json(team, { status: 200 });
    } catch (err: any) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
        }
        console.error('Error aprobando equipo:', err);
        return NextResponse.json(
            { error: 'Error interno aprobando el equipo', details: err?.message ?? String(err) },
            { status: 500 }
        );
    }
}
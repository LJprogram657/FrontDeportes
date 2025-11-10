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

        // Seleccionar la primera fase (order=1) del mismo torneo del equipo
        const firstPhase = await prisma.phase.findFirst({
            where: { tournamentId: team.tournamentId },
            orderBy: { order: 'asc' },
            select: { id: true },
        });

        const phaseId = firstPhase?.id;
        if (!phaseId) {
            return NextResponse.json({ error: 'El torneo no tiene fases configuradas' }, { status: 400 });
        }

        // Evitar duplicado (teamId + phaseId)
        const existingStanding = await prisma.groupStanding.findFirst({
            where: { teamId: id, phaseId },
            select: { id: true },
        });

        if (!existingStanding) {
            await prisma.groupStanding.create({
                data: {
                    teamId: id,
                    phaseId,
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
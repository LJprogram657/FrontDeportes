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
      include: { players: true },
    });
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
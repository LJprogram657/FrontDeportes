import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '@/lib/prisma';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Sirve la plantilla PDF y la rellena con datos del partido si existen.
// Corrige el error de tipo devolviendo un Blob en la Response.

export async function GET(req: NextRequest, { params }: { params: { matchId: string } }) {
  const url = new URL(req.url);
  const modalityParam = url.searchParams.get('modality');
  const modality = modalityParam === 'futbol7' ? 'futbol7' : 'futsal';

  const fileName = modality === 'futbol7' ? 'planilla-futbol7.pdf' : 'planilla-futsal.pdf';
  const filePath = path.join(process.cwd(), 'public', 'templates', fileName);

  try {
    const fileBuffer = await fs.readFile(filePath);

    const matchId = Number(params.matchId);
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: { select: { name: true } },
        homeTeam: { include: { players: { select: { name: true, lastName: true, cedula: true } } } },
        awayTeam: { include: { players: { select: { name: true, lastName: true, cedula: true } } } },
      },
    });

    const doc = await PDFDocument.load(fileBuffer);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const page = pages[0];
    const { width, height } = page.getSize();

    const title = `PLANILLA ${modality === 'futbol7' ? 'FÚTBOL 7' : 'FÚTBOL SALÓN'}`;
    page.drawText(title, { x: 50, y: height - 40, size: 16, font, color: rgb(0, 0, 0) });

    if (match) {
      const torneo = match.tournament?.name ? `Torneo: ${match.tournament.name}` : '';
      const localName = match.homeTeam?.name || 'Equipo Local';
      const awayName = match.awayTeam?.name || 'Equipo Visitante';
      const venue = match.venue ? `Cancha: ${match.venue}` : 'Cancha: —';
      const dateStr = match.date ? new Date(match.date).toLocaleDateString() : '—';
      const timeStr = match.time || '—';

      let y = height - 65;
      if (torneo) {
        page.drawText(torneo, { x: 50, y, size: 12, font });
        y -= 18;
      }
      page.drawText(`Fecha: ${dateStr}   Hora: ${timeStr}`, { x: 50, y, size: 12, font });
      y -= 18;
      page.drawText(venue, { x: 50, y, size: 12, font });
      y -= 24;
      page.drawText(`Local: ${localName}`, { x: 50, y, size: 12, font });
      page.drawText(`Visitante: ${awayName}`, { x: width / 2 + 20, y, size: 12, font });
      y -= 18;

      const leftStartY = y - 10;
      const rightStartY = y - 10;
      const lineHeight = 14;
      page.drawText('Jugadores Local', { x: 50, y: leftStartY + 16, size: 12, font });
      page.drawText('Jugadores Visitante', { x: width / 2 + 20, y: rightStartY + 16, size: 12, font });

      const homePlayers = match.homeTeam?.players || [];
      const awayPlayers = match.awayTeam?.players || [];
      homePlayers.slice(0, 18).forEach((p, i) => {
        const text = `${i + 1}. ${p.name} ${p.lastName} (${p.cedula})`;
        page.drawText(text, { x: 50, y: leftStartY - i * lineHeight, size: 10, font });
      });
      awayPlayers.slice(0, 18).forEach((p, i) => {
        const text = `${i + 1}. ${p.name} ${p.lastName} (${p.cedula})`;
        page.drawText(text, { x: width / 2 + 20, y: rightStartY - i * lineHeight, size: 10, font });
      });
    }

    // Arreglo: convertir Uint8Array a ArrayBuffer estándar para BodyInit
    const pdfBytes = await doc.save();
    // Crear un ArrayBuffer NUEVO para evitar el tipo union con SharedArrayBuffer
    const ab = new ArrayBuffer(pdfBytes.length);
    new Uint8Array(ab).set(pdfBytes);

    return new Response(ab, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName.replace('.pdf', '')}-${params.matchId}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    const msg = `No se encontró la plantilla (${fileName}). Colócala en /FrontDeportes/public/templates/`;
    return new Response(JSON.stringify({ error: msg }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
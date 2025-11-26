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

    // Coordenadas calibradas para la planilla (aprox. A4 595 x 842).
    // Ajustadas para caer en las casillas del encabezado y las columnas de jugadores.
    const coords = {
      titulo: { x: 48, y: height - 36 },
      torneo: { x: 210, y: height - 74 },
      fecha: { x: 70, y: height - 102 },
      hora: { x: 260, y: height - 102 },
      cancha: { x: 70, y: height - 122 },
      equipoLocal: { x: 70, y: height - 152 },
      equipoVisitante: { x: width / 2 + 18, y: height - 152 },
      jugadoresLocalStart: { x: 70, y: height - 174 },
      jugadoresVisitanteStart: { x: width / 2 + 18, y: height - 174 },
      jugadoresLineHeight: 12,
      jugadoresMax: 20,
    } as const;

    const title = `PLANILLA ${modality === 'futbol7' ? 'FÚTBOL 7' : 'FÚTBOL SALÓN'}`;
    page.drawText(title, { x: coords.titulo.x, y: coords.titulo.y, size: 14, font, color: rgb(0, 0, 0) });

    if (match) {
      const torneoName = match.tournament?.name || '';
      const localName = match.homeTeam?.name || 'Equipo Local';
      const awayName = match.awayTeam?.name || 'Equipo Visitante';
      const venue = match.venue || '';
      const dateStr = match.date ? new Date(match.date).toLocaleDateString() : '';
      const timeStr = match.time || '';

      if (torneoName) {
        page.drawText(`TORNEO: ${torneoName}`, { x: coords.torneo.x, y: coords.torneo.y, size: 10.5, font });
      }
      if (dateStr) {
        page.drawText(`Fecha: ${dateStr}`, { x: coords.fecha.x, y: coords.fecha.y, size: 10.5, font });
      }
      if (timeStr) {
        page.drawText(`Hora: ${timeStr}`, { x: coords.hora.x, y: coords.hora.y, size: 10.5, font });
      }
      if (venue) {
        page.drawText(`Cancha: ${venue}`, { x: coords.cancha.x, y: coords.cancha.y, size: 10.5, font });
      }

      // Encabezado de equipo A/B en las líneas rojas
      page.drawText(`EQUIPO A: ${localName}`, { x: coords.equipoLocal.x, y: coords.equipoLocal.y, size: 11, font });
      page.drawText(`EQUIPO B: ${awayName}`, { x: coords.equipoVisitante.x, y: coords.equipoVisitante.y, size: 11, font });

      // Listados de jugadores en las dos columnas principales
      const homePlayers = match.homeTeam?.players || [];
      const awayPlayers = match.awayTeam?.players || [];
      const maxRows = coords.jugadoresMax;
      const lh = coords.jugadoresLineHeight;

      homePlayers.slice(0, maxRows).forEach((p, i) => {
        const text = `${i + 1}. ${p.name} ${p.lastName} (${p.cedula ?? ''})`;
        const y = coords.jugadoresLocalStart.y - i * lh;
        page.drawText(text, { x: coords.jugadoresLocalStart.x, y, size: 9.5, font });
      });
      awayPlayers.slice(0, maxRows).forEach((p, i) => {
        const text = `${i + 1}. ${p.name} ${p.lastName} (${p.cedula ?? ''})`;
        const y = coords.jugadoresVisitanteStart.y - i * lh;
        page.drawText(text, { x: coords.jugadoresVisitanteStart.x, y, size: 9.5, font });
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

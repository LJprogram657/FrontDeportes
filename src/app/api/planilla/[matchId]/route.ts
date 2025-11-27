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

    // No dibujamos título ni otros campos para evitar solapamientos.
    if (match) {
      const dateStr = match.date ? new Date(match.date).toLocaleDateString() : '';
      const timeStr = match.time || '';

      // Fecha y Hora: recolocados para coincidir mejor con el encabezado.
      if (dateStr) {
        page.drawText(`Fecha: ${dateStr}`, { x: 72, y: height - 108, size: 10.5, font });
      }
      if (timeStr) {
        page.drawText(`Hora: ${timeStr}`, { x: 260, y: height - 108, size: 10.5, font });
      }

      // Sólo nombres de jugadores en columnas, reubicados más abajo dentro de la tabla.
      const homePlayers = match.homeTeam?.players || [];
      const awayPlayers = match.awayTeam?.players || [];
      const lh = 12;
      const maxRows = 20;

      const leftStart = { x: 72, y: height - 320 };
      const rightStart = { x: width / 2 + 18, y: height - 320 };

      homePlayers.slice(0, maxRows).forEach((p, i) => {
        const text = `${i + 1}. ${p.name} ${p.lastName} (${p.cedula ?? ''})`;
        const y = leftStart.y - i * lh;
        page.drawText(text, { x: leftStart.x, y, size: 9.5, font });
      });
      awayPlayers.slice(0, maxRows).forEach((p, i) => {
        const text = `${i + 1}. ${p.name} ${p.lastName} (${p.cedula ?? ''})`;
        const y = rightStart.y - i * lh;
        page.drawText(text, { x: rightStart.x, y, size: 9.5, font });
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

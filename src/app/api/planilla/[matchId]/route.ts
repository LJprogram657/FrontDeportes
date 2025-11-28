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

  // Selección de plantilla según modalidad, con nombres canónicos
  const candidateNames =
    modality === 'futbol7'
      ? ['planilla-futbol7.pdf']
      : ['planilla-futsal.pdf'];

  let fileName = candidateNames[0];
  let filePath = path.join(process.cwd(), 'public', 'templates', fileName);

  try {
    // Intentar leer la primera plantilla existente según los candidatos
    let fileBuffer: Buffer | undefined;
    for (const name of candidateNames) {
      const p = path.join(process.cwd(), 'public', 'templates', name);
      try {
        fileBuffer = await fs.readFile(p);
        fileName = name;
        filePath = p;
        break;
      } catch {}
    }
    if (!fileBuffer) {
      fileBuffer = await fs.readFile(filePath);
    }

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

    // Depuración opcional: listar nombres de campos del formulario
    const debug = url.searchParams.get('debug');
    const form = doc.getForm();
    const formFields = (() => {
      try {
        return form.getFields();
      } catch {
        return [] as any[];
      }
    })();
    if (debug === 'form') {
      const names = formFields.map((f: any) => {
        try { return f.getName(); } catch { return 'unknown'; }
      });
      return new Response(JSON.stringify({ template: fileName, fields: names }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

      // Intentar rellenar campos AcroForm si existen; si no, dibujar por coordenadas.
      const setIfPresent = (name: string, value: string) => {
        try {
          const field = form.getTextField(name);
          field.setText(value);
          return true;
        } catch {
          return false;
        }
      };

      // Fecha y Hora: intentar detectar por nombre (contiene "fecha"/"hora"); luego alias; fallback.
      if (dateStr) {
        const names = formFields.map((f: any) => { try { return f.getName(); } catch { return ''; } });
        const auto = names.find(n => /fecha/i.test(n));
        const dateFilled = (auto ? setIfPresent(auto, dateStr) : false) || ['FECHA', 'Fecha', 'fecha'].some(alias => setIfPresent(alias, dateStr));
        if (!dateFilled) {
          page.drawText(`${dateStr}`, { x: 118, y: height - 108, size: 10.5, font });
        }
      }
      if (timeStr) {
        const names = formFields.map((f: any) => { try { return f.getName(); } catch { return ''; } });
        const auto = names.find(n => /hora/i.test(n));
        const timeFilled = (auto ? setIfPresent(auto, timeStr) : false) || ['HORA', 'Hora', 'hora'].some(alias => setIfPresent(alias, timeStr));
        if (!timeFilled) {
          page.drawText(`${timeStr}`, { x: 340, y: height - 108, size: 10.5, font });
        }
      }

      // Sólo nombres y apellidos en dos columnas, centrados en cada fila de la tabla.
      const homePlayers = match.homeTeam?.players || [];
      const awayPlayers = match.awayTeam?.players || [];

      const playerArea = {
        fontSize: 10.5,
        rowHeight: 20, // alto de cada fila
        maxRows: 18,
        // Ajuste fino: subir inicio ~40px y afinar x
        left: { x: 84, width: 226, topY: height - 210 },
        right: { x: width / 2 + 28, width: 226, topY: height - 210 },
      } as const;

      const fitToWidth = (text: string, width: number) => {
        let t = text;
        let w = font.widthOfTextAtSize(t, playerArea.fontSize);
        if (w <= width) return t;
        while (t.length > 3 && w > width) {
          t = t.slice(0, t.length - 1);
          w = font.widthOfTextAtSize(t + '…', playerArea.fontSize);
        }
        return t + '…';
      };

      const drawRowCentered = (txt: string, x: number, boxWidth: number, rowIndex: number, topY: number) => {
        const safe = fitToWidth(txt, boxWidth);
        const tw = font.widthOfTextAtSize(safe, playerArea.fontSize);
        const cx = x + Math.max(0, (boxWidth - tw) / 2);
        // centrar verticalmente en la fila: baseline = top - idx*rowHeight - (rowHeight - fontSize)/2
        const baseline = topY - rowIndex * playerArea.rowHeight - ((playerArea.rowHeight - playerArea.fontSize) / 2);
        page.drawText(safe, { x: cx, y: baseline, size: playerArea.fontSize, font });
      };

      // Detección automática de nombres de campo por lado e índice
      const allFieldNames = formFields.map((f: any) => { try { return f.getName(); } catch { return ''; } });
      const mapByIndex = (side: 'A' | 'B') => {
        const regexes = [
          new RegExp(`^${side}[ _-]?NOMBRE[ _-]?(\\d{1,2})$`, 'i'),
          new RegExp(`^NOMBRE[ _-]?${side}[ _-]?(\\d{1,2})$`, 'i'),
          new RegExp(`^EQUIPO[ _-]?${side}[ _-]?(\\d{1,2})$`, 'i'),
          new RegExp(`^${side}[ _-]?(\\d{1,2})$`, 'i'),
          new RegExp(`^${side}(\\d{2})$`, 'i'),
        ];
        const map: Record<number, string> = {};
        for (const n of allFieldNames) {
          for (const rx of regexes) {
            const m = n.match(rx);
            if (m) {
              const idx = Number(m[1]);
              if (idx >= 1 && idx <= playerArea.maxRows && !(idx in map)) {
                map[idx] = n;
                break;
              }
            }
          }
        }
        for (let i = 1; i <= playerArea.maxRows; i++) {
          const key1 = `${side}_NOMBRE_${String(i).padStart(2, '0')}`;
          const key2 = `${side}_NOMBRE_${i}`;
          if (!map[i] && allFieldNames.includes(key1)) map[i] = key1;
          if (!map[i] && allFieldNames.includes(key2)) map[i] = key2;
        }
        return map;
      };

      const mapA = mapByIndex('A');
      const mapB = mapByIndex('B');

      homePlayers.slice(0, playerArea.maxRows).forEach((p, i) => {
        const text = `${p.name} ${p.lastName}`.trim();
        const target = mapA[i + 1];
        const set = target ? setIfPresent(target, text) : false;
        if (!set) {
          drawRowCentered(text, playerArea.left.x, playerArea.left.width, i, playerArea.left.topY);
        }
      });
      awayPlayers.slice(0, playerArea.maxRows).forEach((p, i) => {
        const text = `${p.name} ${p.lastName}`.trim();
        const target = mapB[i + 1];
        const set = target ? setIfPresent(target, text) : false;
        if (!set) {
          drawRowCentered(text, playerArea.right.x, playerArea.right.width, i, playerArea.right.topY);
        }
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

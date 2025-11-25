import { NextRequest } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// Simple endpoint that serves pre-made PDF templates based on modality.
// Later we can replace this with dynamic filling using pdf-lib.

export async function GET(req: NextRequest, { params }: { params: { matchId: string } }) {
  const url = new URL(req.url);
  const modalityParam = url.searchParams.get('modality');

  // Normalize modality
  const modality = modalityParam === 'futbol7' ? 'futbol7' : 'futsal';

  const fileName = modality === 'futbol7' ? 'planilla-futbol7.pdf' : 'planilla-futsal.pdf';
  // En Next, el cwd ya es la raíz del proyecto FrontDeportes
  const filePath = path.join(process.cwd(), 'public', 'templates', fileName);

  try {
    const fileBuffer = await fs.readFile(filePath);
    // Convertimos a Uint8Array (ArrayBufferView), aceptado por BodyInit
    const binary = new Uint8Array(fileBuffer);
    return new Response(binary, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName.replace('.pdf', '')}-${params.matchId}.pdf"`,
      },
    });
  } catch (err: any) {
    const msg = `No se encontró la plantilla (${fileName}). Colócala en /FrontDeportes/public/templates/`;
    return new Response(JSON.stringify({ error: msg }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
}
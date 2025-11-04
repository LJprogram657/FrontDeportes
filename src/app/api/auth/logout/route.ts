import { NextResponse } from 'next/server';

export async function POST() {
  // Opcional: invalidar refresh en servidor si lo manejas
  return NextResponse.json({ success: true, message: 'Sesión cerrada' }, { status: 200 });
}
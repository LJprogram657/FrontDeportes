import { NextResponse } from 'next/server';

export async function POST() {
  // Si en el futuro invalidas refresh tokens en servidor, hazlo aquí.
  return NextResponse.json({ success: true, message: 'Sesión cerrada' }, { status: 200 });
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signAccessToken, signRefreshToken } from '@/lib/auth';
import { ensureAdminExists } from '@/lib/bootstrap';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Datos inválidos', errors: { email: ['Email y contraseña requeridos'] } },
        { status: 400 }
      );
    }

    // Bootstrap: asegura que el admin exista antes de validar credenciales
    await ensureAdminExists();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Credenciales inválidas' }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.password);
    // Solo permite login si es admin y está activo
    if (!ok || !user.isActive || !user.isAdmin) {
      return NextResponse.json({ success: false, message: 'Credenciales inválidas o no autorizado' }, { status: 401 });
    }

    // Tras validar credenciales y obtener el usuario desde Prisma:
    // Asegúrate de tener disponible la variable `user` aquí (usuario válido).
    // Supone que ya has buscado y validado al usuario en Prisma: const user = ...
    const userJwt = { sub: user.id, email: user.email, isAdmin: user.isAdmin };
    
    const access = signAccessToken(userJwt);
    const refresh = signRefreshToken(userJwt);
    
    return NextResponse.json({ access, refresh, user: userJwt }, { status: 200 });
  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
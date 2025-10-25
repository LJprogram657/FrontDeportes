import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signAccessToken } from '@/lib/auth';
import { ensureAdminExists } from '@/lib/bootstrap';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
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

    const access = signAccessToken({ sub: user.id, email: user.email, isAdmin: user.isAdmin });
    return NextResponse.json(
      {
        success: true,
        message: 'Login exitoso',
        access,
        refresh: null,
        user: { id: user.id, username: user.email, email: user.email, is_admin: user.isAdmin },
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
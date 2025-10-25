import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signAccessToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password, first_name = '', last_name = '' } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Datos inválidos', errors: { email: ['Email y contraseña requeridos'] } },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { success: false, message: 'Datos inválidos', errors: { email: ['El email ya está registrado'] } },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, firstName: first_name, lastName: last_name, isAdmin: false, isActive: true },
    });

    const access = signAccessToken({ sub: user.id, email: user.email, isAdmin: user.isAdmin });
    return NextResponse.json(
      {
        success: true,
        message: 'Usuario registrado exitosamente',
        access,
        refresh: null, // puedes implementar refresh token luego
        user: { id: user.id, username: user.email, email: user.email, is_admin: user.isAdmin },
      },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Error interno del servidor' }, { status: 500 });
  }
}
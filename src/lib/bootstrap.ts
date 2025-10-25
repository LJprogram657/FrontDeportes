import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Crea el admin automáticamente si no existe ningún usuario.
// Usa ADMIN_EMAIL y ADMIN_PASSWORD si están definidos; si no, aplica por defecto.
export async function ensureAdminExists() {
  const count = await prisma.user.count();
  if (count > 0) return;

  const email = process.env.ADMIN_EMAIL || 'admin@deportes.cam';
  const password = process.env.ADMIN_PASSWORD || 'Depo!Admin#2024';

  const hashed = await bcrypt.hash(password, 10);

  try {
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
        isActive: true,
      },
    });
    console.log(`Admin creado: ${email}`);
  } catch (e) {
    console.error('Bootstrap admin error:', e);
  }
}
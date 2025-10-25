import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Crea/garantiza el usuario admin.
// - Si no existe, lo crea.
// - Si existe, asegura isAdmin/isActive y opcionalmente resetea la contraseña si ADMIN_FORCE_RESET=true.
export async function ensureAdminExists() {
  const count = await prisma.user.count();
  if (count > 0) return;

  const email = process.env.ADMIN_EMAIL || 'admin@deportes.cam';
  const password = process.env.ADMIN_PASSWORD || 'Depo!Admin#2024';
  const forceReset = process.env.ADMIN_FORCE_RESET === 'true';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
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
      console.error('Bootstrap admin error (create):', e);
    }
    return;
  }

  const data: any = {};
  if (!existing.isAdmin) data.isAdmin = true;
  if (!existing.isActive) data.isActive = true;
  if (forceReset) data.password = await bcrypt.hash(password, 10);

  if (Object.keys(data).length > 0) {
    try {
      await prisma.user.update({ where: { email }, data });
      console.log(
        `Admin verificado/actualizado: ${email}${forceReset ? ' (contraseña reseteada)' : ''}`
      );
    } catch (e) {
      console.error('Bootstrap admin error (update):', e);
    }
  } else {
    console.log(`Admin verificado: ${email}`);
  }
}
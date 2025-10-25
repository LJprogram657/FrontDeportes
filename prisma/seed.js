const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('ADMIN_EMAIL y ADMIN_PASSWORD son requeridos como variables de entorno.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('El usuario admin ya existe, se omite creación:', existing.email);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      email,
      password: hashed,
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      isActive: true,
    },
  });

  console.log('Usuario admin creado exitosamente:', admin.email);
}

main()
  .catch(err => {
    console.error('Error en seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
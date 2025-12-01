// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function initAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.user.findFirst({
      where: { isAdmin: true },
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Password123', 10);

    const admin = await db.user.create({
      data: {
        email: 'admin@lab.local',
        name: 'Admin',
        password: hashedPassword,
        isAdmin: true,
        passwordChangeRequired: true,
      },
    });

    console.log('Admin user created successfully:');
    console.log('Email: admin@lab.local');
    console.log('Password: Password123');
    console.log('Please change the password on first login.');
  } catch (error) {
    console.error('Error initializing admin:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

initAdmin();


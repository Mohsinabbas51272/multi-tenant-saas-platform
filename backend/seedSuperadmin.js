const bcrypt = require('bcrypt');
const prisma = require('./config/db');

const seedSuperadmin = async () => {
  try {
    console.log('Database connecting via Prisma...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'superadmin@saas.com' },
      update: {},
      create: {
        name: 'Super Admin',
        email: 'superadmin@saas.com',
        password: hashedPassword,
        role: 'superadmin',
        tenant_id: null
      }
    });

    console.log('Superadmin user ready:', user.email);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding superadmin:', err);
    process.exit(1);
  }
};

seedSuperadmin();

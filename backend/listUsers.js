const prisma = require('./config/db');

const listUsers = async () => {
  try {
    const users = await prisma.user.findMany({
      include: {
        tenant: true
      }
    });
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listUsers();

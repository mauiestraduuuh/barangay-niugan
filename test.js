import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const newUser = await prisma.user.create({
    data: {
      username: 'apitest',
      password: '123456',
      role: 'RESIDENT', // must match enum
    },
  });
  console.log('Created user:', newUser);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

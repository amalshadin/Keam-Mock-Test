import prisma from '../prismaClient.js';

async function check() {
  const tests = await prisma.test.findMany();
  console.log("Tests in database:");
  tests.forEach(t => {
    console.log(`ID: ${t.test_id}, Title: ${t.title}, Start: ${t.start_time}, End: ${t.end_time}`);
  });
  process.exit(0);
}

check();

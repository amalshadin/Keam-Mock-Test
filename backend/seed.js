import prisma from './prismaClient.js';

async function main() {
  console.log("Seeding database...");

  // 1. Create Subjects
  const physics = await prisma.subject.upsert({
    where: { subject_name: 'Physics' },
    update: {},
    create: { subject_name: 'Physics' }
  });

  const chemistry = await prisma.subject.upsert({
    where: { subject_name: 'Chemistry' },
    update: {},
    create: { subject_name: 'Chemistry' }
  });

  const maths = await prisma.subject.upsert({
    where: { subject_name: 'Mathematics' },
    update: {},
    create: { subject_name: 'Mathematics' }
  });

  // 2. Create a Test
  const test = await prisma.test.create({
    data: {
      title: 'KEAM Mock Test 1',
      duration_minutes: 180,
      start_time: new Date(),
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      price: 50.0
    }
  });

  // 3. Create Questions & Options
  const qs = [
    {
      text: "What is the SI unit of force?", subjectId: physics.subject_id, options: [
        { text: "Newton", correct: true }, { text: "Joule", correct: false }, { text: "Watt", correct: false }, { text: "Pascal", correct: false }
      ]
    },
    {
      text: "What is the atomic number of Carbon?", subjectId: chemistry.subject_id, options: [
        { text: "5", correct: false }, { text: "6", correct: true }, { text: "7", correct: false }, { text: "8", correct: false }
      ]
    },
    {
      text: "What is the derivative of x^2?", subjectId: maths.subject_id, options: [
        { text: "x", correct: false }, { text: "2x", correct: true }, { text: "x^3/3", correct: false }, { text: "2", correct: false }
      ]
    }
  ];

  for (let qInfo of qs) {
    const q = await prisma.question.create({
      data: {
        question_text: qInfo.text,
        subject_id: qInfo.subjectId,
        options: {
          create: qInfo.options.map(o => ({
            option_text: o.text,
            is_correct: o.correct
          }))
        }
      }
    });

    await prisma.testQuestion.create({
      data: {
        test_id: test.test_id,
        question_id: q.question_id
      }
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

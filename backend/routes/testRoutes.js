import express from 'express';
import prisma from '../prismaClient.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all available tests (for dashboard)
router.get('/', protect, async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      orderBy: { created_at: 'desc' },
      select: { test_id: true, title: true, duration_minutes: true, start_time: true, end_time: true, price: true }
    });
    res.json({
      tests,
      free_mode: process.env.FREE_EXAM_MODE === 'true'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get test details and questions with options (no is_correct)
router.get('/:id', protect, async (req, res) => {
  const testId = parseInt(req.params.id);
  try {
    const test = await prisma.test.findUnique({
      where: { test_id: testId },
      include: {
        questions: {
          include: {
            question: {
              include: {
                options: {
                  select: { option_id: true, option_text: true } // Hide is_correct
                }
              }
            }
          }
        }
      }
    });

    if (!test) return res.status(404).json({ error: 'Test not found' });

    // Flatten structure for easier client consumption
    const payload = {
      test_id: test.test_id,
      title: test.title,
      duration_minutes: test.duration_minutes,
      questions: test.questions.map(tq => ({
        question_id: tq.question.question_id,
        subject_id: tq.question.subject_id,
        question_text: tq.question.question_text,
        options: tq.question.options
      }))
    };

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

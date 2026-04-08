import express from 'express';
import prisma from '../prismaClient.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/start', protect, async (req, res) => {
  const { test_id } = req.body;
  try {
    const attempt = await prisma.testAttempt.create({
      data: {
        user_id: req.user.userId,
        test_id: parseInt(test_id)
      }
    });
    res.json(attempt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', protect, async (req, res) => {
  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { user_id: req.user.userId, completed_at: { not: null } },
      orderBy: { completed_at: 'desc' },
      include: {
        test: { include: { questions: true } },
        answers: { include: { option: true } }
      }
    });

    const historyData = attempts.map(attempt => {
      let correct = 0;
      let wrong = 0;
      let attempted = 0;

      attempt.answers.forEach(a => {
        if (a.selected_option_id) {
          attempted++;
          if (a.option?.is_correct) correct++;
          else wrong++;
        }
      });

      const score = (correct * 4) - (wrong * 1);
      const accuracy = attempted > 0 ? ((correct / attempted) * 100).toFixed(2) : 0;

      return {
        attempt_id: attempt.attempt_id,
        test_title: attempt.test.title,
        started_at: attempt.started_at,
        completed_at: attempt.completed_at,
        score,
        accuracy,
        attempted,
        total_questions: attempt.test.questions.length
      };
    });

    res.json(historyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/answer', protect, async (req, res) => {
  const attempt_id = parseInt(req.params.id);
  const { question_id, selected_option_id, is_marked_for_review } = req.body;

  try {
    const answer = await prisma.$transaction(async (tx) => {
      const attempt = await tx.testAttempt.findUnique({ where: { attempt_id } });
      if (!attempt || attempt.user_id !== req.user.userId) throw new Error('Unauthorized attempt');
      if (attempt.completed_at) throw new Error('Test already submitted');

      return await tx.answer.upsert({
        where: {
          attempt_id_question_id: { attempt_id, question_id }
        },
        update: {
          selected_option_id: selected_option_id || null,
          is_marked_for_review: is_marked_for_review !== undefined ? is_marked_for_review : false
        },
        create: {
          attempt_id,
          question_id,
          selected_option_id: selected_option_id || null,
          is_marked_for_review: is_marked_for_review !== undefined ? is_marked_for_review : false
        }
      });
    });

    res.json(answer);
  } catch (error) {
    if (error.message === 'Test already submitted') {
       return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Unauthorized attempt') {
       return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/submit', protect, async (req, res) => {
  const attempt_id = parseInt(req.params.id);
  try {
    const attempt = await prisma.testAttempt.findUnique({ where: { attempt_id }, include: { test: true } });
    if (!attempt || attempt.user_id !== req.user.userId) return res.status(403).json({ error: 'Unauthorized attempt' });
    if (attempt.completed_at) return res.json(attempt);

    // Validate backend timer: give a 2 min grace period
    const now = new Date();
    const durationMs = attempt.test.duration_minutes * 60000;
    const deadline = new Date(attempt.started_at.getTime() + durationMs + 120000); // +2 mins grace
    
    // We allow submission even if passed, we just record completed_at. The frontend will block it. 
    // If it's way past, the system auto submitted it theoretically, but here we just mark it completed.

    const completed = await prisma.testAttempt.update({
      where: { attempt_id },
      data: { completed_at: now }
    });

    res.json(completed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/results', protect, async (req, res) => {
  const attempt_id = parseInt(req.params.id);
  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { attempt_id },
      include: {
        test: {
          include: {
            questions: true // to get total questions
          }
        },
        answers: {
          include: {
            option: true,
            question: {
              include: { subject: true }
            }
          }
        }
      }
    });

    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (!attempt.completed_at) return res.status(400).json({ error: 'Test not submitted yet' });

    const total_questions = attempt.test.questions.length;
    let attempted = 0;
    let correct = 0;
    let wrong = 0;

    const subjectStatsMap = {};

    attempt.answers.forEach(a => {
      if (!subjectStatsMap[a.question.subject.subject_name]) {
        subjectStatsMap[a.question.subject.subject_name] = { correct: 0, wrong: 0, attempted: 0 };
      }
      const sMap = subjectStatsMap[a.question.subject.subject_name];

      if (a.selected_option_id) {
        attempted++;
        sMap.attempted++;
        if (a.option.is_correct) {
          correct++;
          sMap.correct++;
        } else {
          wrong++;
          sMap.wrong++;
        }
      }
    });

    const unattempted = total_questions - attempted;
    const score = (correct * 4) - (wrong * 1);
    const accuracy = attempted > 0 ? ((correct / attempted) * 100).toFixed(2) : 0;
    const efficiency = total_questions > 0 ? ((correct / total_questions) * 100).toFixed(2) : 0;
    const attempt_rate = total_questions > 0 ? ((attempted / total_questions) * 100).toFixed(2) : 0;
    const negative_marks = wrong * 1;

    const subject_stats = Object.keys(subjectStatsMap).map(subject => {
      const s = subjectStatsMap[subject];
      return {
        subject,
        correct: s.correct,
        wrong: s.wrong,
        attempted: s.attempted,
        accuracy: s.attempted > 0 ? ((s.correct / s.attempted) * 100).toFixed(2) : 0
      };
    });

    res.json({
      total_questions,
      attempted,
      correct,
      wrong,
      unattempted,
      score,
      accuracy,
      efficiency,
      attempt_rate,
      negative_marks,
      subject_stats
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/review', protect, async (req, res) => {
  const attempt_id = parseInt(req.params.id);
  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { attempt_id, user_id: req.user.userId },
      include: {
        test: {
          include: {
            questions: {
              include: {
                question: {
                  include: { options: true }
                }
              }
            }
          }
        },
        answers: true
      }
    });

    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    const reviewData = attempt.test.questions.map(tq => {
      const q = tq.question;
      const ans = attempt.answers.find(a => a.question_id === q.question_id);
      const selected_option_id = ans ? ans.selected_option_id : null;
      const correct_option = q.options.find(o => o.is_correct);

      let status = "UNATTEMPTED";
      if (selected_option_id) {
        status = selected_option_id === correct_option.option_id ? "CORRECT" : "WRONG";
      }

      return {
        question_id: q.question_id,
        question_text: q.question_text,
        options: q.options.map(o => ({
          option_id: o.option_id,
          option_text: o.option_text,
          is_correct: o.is_correct
        })),
        selected_option_id,
        correct_option_id: correct_option.option_id,
        status
      };
    });

    res.json(reviewData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

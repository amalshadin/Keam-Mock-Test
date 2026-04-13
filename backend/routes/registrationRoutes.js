import express from 'express';
import prisma from '../prismaClient.js';
import { protect } from '../middleware/authMiddleware.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Get my registrations
router.get('/mine', protect, async (req, res) => {
  try {
    const registrations = await prisma.examRegistration.findMany({
      where: { user_id: req.user.userId },
      include: {
        test: true,
        attempt: true
      },
      orderBy: { registered_at: 'desc' }
    });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register for an exam & initialize payment order
router.post('/register', protect, async (req, res) => {
  const { test_id } = req.body;
  try {
    const testInfo = await prisma.test.findUnique({ where: { test_id: parseInt(test_id) } });
    if (!testInfo) return res.status(404).json({ error: 'Test not found' });

    // Handle existing registrations
    const existingEntry = await prisma.examRegistration.findUnique({
      where: {
        user_id_test_id: {
          user_id: req.user.userId,
          test_id: parseInt(test_id)
        }
      }
    });

    if (existingEntry) {
      if (existingEntry.payment_status === 'PAID') {
        return res.status(400).json({ error: 'You are already registered for this exam.' });
      }
      
      if (process.env.FREE_EXAM_MODE === 'true') {
        const updated = await prisma.examRegistration.update({
          where: { registration_id: existingEntry.registration_id },
          data: { payment_status: 'PAID', amount: 0 }
        });
        return res.json(updated);
      }

      // If PENDING, generate a new Razorpay order to be safe
      const optionEx = { amount: testInfo.price * 100, currency: "INR", receipt: existingEntry.registration_id };
      const orderEx = await razorpay.orders.create(optionEx);
      
      await prisma.examRegistration.update({
        where: { registration_id: existingEntry.registration_id },
        data: { payment_id: orderEx.id }
      });
      
      return res.json({ ...existingEntry, razorpay_order_id: orderEx.id, key_id: process.env.RAZORPAY_API_KEY });
    }

    // New Registration
    if (process.env.FREE_EXAM_MODE === 'true') {
      const reg = await prisma.examRegistration.create({
        data: {
          user_id: req.user.userId,
          test_id: parseInt(test_id),
          amount: 0,
          payment_status: 'PAID'
        }
      });
      return res.json(reg);
    }

    const reg = await prisma.examRegistration.create({
      data: {
        user_id: req.user.userId,
        test_id: parseInt(test_id),
        amount: testInfo.price,
        payment_status: 'PENDING'
      }
    });

    // Create Razorpay Order
    const options = { amount: testInfo.price * 100, currency: "INR", receipt: reg.registration_id };
    const order = await razorpay.orders.create(options);

    await prisma.examRegistration.update({
      where: { registration_id: reg.registration_id },
      data: { payment_id: order.id }
    });

    res.json({ ...reg, razorpay_order_id: order.id, key_id: process.env.RAZORPAY_API_KEY });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify signature on payment success
router.post('/verify', protect, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registration_id } = req.body;

  try {
    const existingEntry = await prisma.examRegistration.findUnique({
      where: { registration_id, user_id: req.user.userId }
    });

    if (!existingEntry) return res.status(404).json({ error: 'Registration not found' });

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
      const reg = await prisma.examRegistration.update({
        where: { registration_id },
        data: {
          payment_status: 'PAID',
          payment_id: razorpay_payment_id
        }
      });
      res.json(reg);
    } else {
      res.status(400).json({ error: "Invalid payment signature" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

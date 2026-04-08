import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';
import { Resend } from 'resend';

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit phone number' });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      if (user.is_verified) {
        return res.status(400).json({ error: 'User already exists and is verified. Please login.' });
      }
      // If unverified, update details rather than failing
      const password_hash = await bcrypt.hash(password, 10);
      user = await prisma.user.update({
        where: { user_id: user.user_id },
        data: { name, password_hash, phone }
      });
    } else {
      const password_hash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: { name, email, password_hash, phone, is_verified: false }
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database
    await prisma.oTPVerification.create({
      data: {
        user_id: user.user_id,
        otp_code: otp,
        type: "EMAIL",
        expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 min
      }
    });

    try {
      if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
      
      console.log(`[Email] Attempting to send OTP to ${email} via Resend...`);
      
      await resend.emails.send({
        from: 'KEAM Support <onboarding@resend.dev>',
        to: email,
        subject: "Your KEAM Mock Test OTP",
        text: `Your OTP for account verification is: ${otp}. It is valid for 5 minutes.`
      });
      
      console.log(`[Email] OTP successfully sent to ${email}`);
    } catch (mailErr) {
      console.error("[Email Error] Resend failed:", mailErr.message);
      console.log(`\n\n=== MOCK EMAIL OTP FALLBACK ===\nTo: ${email}\nOTP: ${otp}\n================================\n\n`);
    }

    res.json({ message: 'OTP sent successfully', user_id: user.user_id, email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/resend-otp', async (req, res) => {
  const { user_id } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { user_id: parseInt(user_id) } });
    if (!user || user.is_verified) return res.status(400).json({ error: 'Invalid request' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.oTPVerification.create({
      data: {
        user_id: user.user_id,
        otp_code: otp,
        type: "EMAIL",
        expires_at: new Date(Date.now() + 5 * 60 * 1000)
      }
    });

    try {
      if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
      
      console.log(`[Email] Attempting to resend OTP to ${user.email} via Resend...`);

      await resend.emails.send({
        from: 'KEAM Support <onboarding@resend.dev>',
        to: user.email,
        subject: "Your KEAM Mock Test OTP (Resend)",
        text: `Your new OTP for account verification is: ${otp}. It is valid for 5 minutes.`
      });

      console.log(`[Email] Resend OTP successfully sent to ${user.email}`);
    } catch (mailErr) {
      console.error("[Email Error] Resend failed:", mailErr.message);
      console.log(`\n\n=== MOCK EMAIL OTP FALLBACK ===\nTo: ${user.email}\nOTP: ${otp}\n================================\n\n`);
    }

    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { user_id, otp_code } = req.body;
  try {
    const record = await prisma.oTPVerification.findFirst({
      where: {
        user_id: parseInt(user_id),
        otp_code: otp_code,
        is_used: false
      }
    });

    if (!record) return res.status(400).json({ error: 'Invalid OTP' });
    if (record.expires_at < new Date()) return res.status(400).json({ error: 'OTP expired' });

    await prisma.oTPVerification.update({
      where: { id: record.id },
      data: { is_used: true }
    });

    const user = await prisma.user.update({
      where: { user_id: parseInt(user_id) },
      data: { is_verified: true }
    });

    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET || 'keam_mock_super_secret_key', { expiresIn: '30d' });
    res.json({ user_id: user.user_id, name: user.name, email: user.email, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.is_verified) return res.status(403).json({ error: 'Please verify your email via OTP. Check your inbox.' });

    if (await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET || 'keam_mock_super_secret_key', { expiresIn: '30d' });
      res.json({ user_id: user.user_id, name: user.name, email: user.email, token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

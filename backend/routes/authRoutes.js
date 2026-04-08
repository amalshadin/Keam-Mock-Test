import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) return res.status(400).json({ error: 'User already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password_hash }
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
    if (user && (await bcrypt.compare(password, user.password_hash))) {
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

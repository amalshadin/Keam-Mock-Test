import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'keam_mock_super_secret_key');
      
      // Verify user actually exists in the database
      const user = await prisma.user.findUnique({ where: { user_id: decoded.userId } });
      if (!user) {
        return res.status(401).json({ error: 'User no longer exists' });
      }

      req.user = decoded; // { userId }
      next();
    } catch (error) {
      res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ error: 'Not authorized, no token' });
  }
};

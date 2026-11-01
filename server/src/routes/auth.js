import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();
const makeToken = (user) => jwt.sign(
  { id: user._id.toString(), name: user.name, email: user.email },
  process.env.JWT_SECRET || 'development_secret_change_me',
  { expiresIn: '8h' }
);

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      return res.status(400).json({ message: 'Name, email, and password (at least 8 characters) are required.' });
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({
      name: name.trim(), email: email.toLowerCase().trim(),
      passwordHash: await bcrypt.hash(password, 12)
    });
    res.status(201).json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Enter your email and password.' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { next(err); }
});

export default router;

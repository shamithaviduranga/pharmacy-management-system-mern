import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import medicineRoutes from './routes/medicines.js';
import salesRoutes from './routes/sales.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured before starting in production.');
}
const app = express();
const clientOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: clientOrigins }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Pharmacy Management API' }));
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === 'CastError' || err.name === 'StrictModeError') {
    return res.status(400).json({ message: 'The submitted data is invalid.' });
  }
  const status = err.status || 500;
  res.status(status).json({
    message: status >= 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected server error occurred.'
      : err.message || 'Server error'
  });
});

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pharmacy_management')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

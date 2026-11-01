import { Router } from 'express';
import Medicine from '../models/Medicine.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', async (req, res, next) => {
  try {
    const { search = '', lowStock } = req.query;
    const query = typeof search === 'string' ? search.trim().slice(0, 100) : '';
    const filter = query ? {
      $or: [
        { name: { $regex: escapeRegex(query), $options: 'i' } },
        { genericName: { $regex: escapeRegex(query), $options: 'i' } },
        { category: { $regex: escapeRegex(query), $options: 'i' } },
        { batchNumber: { $regex: escapeRegex(query), $options: 'i' } }
      ]
    } : {};
    let medicines = await Medicine.find(filter).sort({ name: 1 });
    if (lowStock === 'true') medicines = medicines.filter(m => m.quantity <= m.reorderLevel);
    res.json(medicines);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const medicine = await Medicine.create(req.body);
    res.status(201).json(medicine);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      strict: 'throw'
    });
    if (!medicine) return res.status(404).json({ message: 'Medicine not found.' });
    res.json(medicine);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found.' });
    res.json({ message: 'Medicine deleted.' });
  } catch (err) { next(err); }
});

export default router;

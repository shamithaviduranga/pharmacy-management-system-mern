import { Router } from 'express';
import Medicine from '../models/Medicine.js';
import Sale from '../models/Sale.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

router.get('/', async (_req, res, next) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 }).limit(200);
    res.json(sales);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Add at least one item to the sale.' });
    }

    // Validate the whole cart before changing stock.
    const prepared = [];
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be a positive whole number.' });
      }
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) return res.status(404).json({ message: 'A selected medicine was not found.' });
      if (medicine.quantity < quantity) {
        return res.status(400).json({ message: `Not enough stock for ${medicine.name}.` });
      }
      prepared.push({ medicine, quantity });
    }

    const saleItems = [];
    let total = 0;
    for (const { medicine, quantity } of prepared) {
      medicine.quantity -= quantity;
      await medicine.save();
      const lineTotal = quantity * medicine.sellingPrice;
      total += lineTotal;
      saleItems.push({
        medicine: medicine._id,
        medicineName: medicine.name,
        quantity,
        unitPrice: medicine.sellingPrice,
        lineTotal
      });
    }

    const sale = await Sale.create({ items: saleItems, total, soldBy: req.user.id });
    res.status(201).json(sale);
  } catch (err) { next(err); }
});

export default router;

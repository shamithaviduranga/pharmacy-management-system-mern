import { Router } from 'express';
import mongoose from 'mongoose';
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
  const updatedStock = [];
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Add at least one item to the sale.' });
    }

    const quantities = new Map();
    for (const item of items) {
      if (!item || typeof item !== 'object') {
        return res.status(400).json({ message: 'Each sale item must include a medicine and quantity.' });
      }
      const quantity = Number(item.quantity);
      if (!mongoose.isValidObjectId(item.medicineId)) {
        return res.status(400).json({ message: 'A selected medicine ID is invalid.' });
      }
      if (!Number.isSafeInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be a positive whole number.' });
      }
      const totalQuantity = (quantities.get(item.medicineId) || 0) + quantity;
      if (!Number.isSafeInteger(totalQuantity)) {
        return res.status(400).json({ message: 'The requested quantity is too large.' });
      }
      quantities.set(item.medicineId, totalQuantity);
    }

    const saleItems = [];
    let total = 0;
    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    for (const [medicineId, quantity] of quantities) {
      const medicine = await Medicine.findOneAndUpdate(
        { _id: medicineId, quantity: { $gte: quantity }, expiryDate: { $gte: todayUtc } },
        { $inc: { quantity: -quantity } },
        { new: true, runValidators: true }
      );
      if (!medicine) {
        const existing = await Medicine.findById(medicineId);
        if (!existing) {
          await restoreStock(updatedStock);
          return res.status(404).json({ message: 'A selected medicine was not found.' });
        }
        if (existing.expiryDate < todayUtc) {
          await restoreStock(updatedStock);
          return res.status(400).json({ message: `${existing.name} has expired and cannot be sold.` });
        }
        await restoreStock(updatedStock);
        return res.status(400).json({ message: `Not enough stock for ${existing.name}.` });
      }
      updatedStock.push({ medicineId, quantity });
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
  } catch (err) {
    try {
      await restoreStock(updatedStock);
    } catch (rollbackError) {
      console.error('Failed to restore medicine stock after an incomplete sale:', rollbackError);
    }
    next(err);
  }
});

async function restoreStock(updatedStock) {
  while (updatedStock.length) {
    const { medicineId, quantity } = updatedStock[0];
    const result = await Medicine.updateOne({ _id: medicineId }, { $inc: { quantity } });
    if (result.modifiedCount !== 1) {
      throw new Error('Could not restore all medicine stock after an incomplete sale.');
    }
    updatedStock.shift();
  }
}

export default router;

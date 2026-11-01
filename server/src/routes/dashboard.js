import { Router } from 'express';
import Medicine from '../models/Medicine.js';
import Sale from '../models/Sale.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

router.get('/', async (_req, res, next) => {
  try {
    const medicines = await Medicine.find();
    const sales = await Sale.find().sort({ createdAt: -1 });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales = sales.filter(s => new Date(s.createdAt) >= today);
    res.json({
      medicineCount: medicines.length,
      lowStockCount: medicines.filter(m => m.quantity <= m.reorderLevel).length,
      inventoryValue: medicines.reduce((sum, m) => sum + m.quantity * m.purchasePrice, 0),
      todaySalesTotal: todaySales.reduce((sum, s) => sum + s.total, 0),
      recentSales: sales.slice(0, 5)
    });
  } catch (err) { next(err); }
});

export default router;

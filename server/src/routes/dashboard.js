import { Router } from 'express';
import Medicine from '../models/Medicine.js';
import Sale from '../models/Sale.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

router.get('/', async (_req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [inventoryStats, todaySales, recentSales] = await Promise.all([
      Medicine.aggregate([{
        $group: {
          _id: null,
          medicineCount: { $sum: 1 },
          lowStockCount: {
            $sum: { $cond: [{ $lte: ['$quantity', '$reorderLevel'] }, 1, 0] }
          },
          inventoryValue: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } }
        }
      }]),
      Sale.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Sale.find().sort({ createdAt: -1 }).limit(5)
    ]);
    const inventory = inventoryStats[0] || { medicineCount: 0, lowStockCount: 0, inventoryValue: 0 };
    res.json({
      medicineCount: inventory.medicineCount,
      lowStockCount: inventory.lowStockCount,
      inventoryValue: inventory.inventoryValue,
      todaySalesTotal: todaySales[0]?.total || 0,
      recentSales
    });
  } catch (err) { next(err); }
});

export default router;

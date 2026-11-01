import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  genericName: { type: String, default: '' },
  category: { type: String, default: 'General' },
  batchNumber: { type: String, default: '' },
  supplier: { type: String, default: '' },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, required: true, min: 0 },
  reorderLevel: { type: Number, default: 10, min: 0 },
  purchasePrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 }
}, { timestamps: true });

export default mongoose.model('Medicine', medicineSchema);

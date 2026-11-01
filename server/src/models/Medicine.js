import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  genericName: { type: String, default: '', trim: true, maxlength: 120 },
  category: { type: String, default: 'General', trim: true, maxlength: 80 },
  batchNumber: { type: String, default: '', trim: true, maxlength: 80 },
  supplier: { type: String, default: '', trim: true, maxlength: 120 },
  expiryDate: {
    type: Date,
    required: true,
    validate: { validator: (value) => !Number.isNaN(value.getTime()), message: 'Enter a valid expiry date.' }
  },
  quantity: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  reorderLevel: { type: Number, default: 10, min: 0, validate: Number.isSafeInteger },
  purchasePrice: { type: Number, required: true, min: 0, validate: Number.isFinite },
  sellingPrice: { type: Number, required: true, min: 0, validate: Number.isFinite }
}, { timestamps: true });

export default mongoose.model('Medicine', medicineSchema);

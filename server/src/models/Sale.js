import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  items: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 }
  }],
  total: { type: Number, required: true, min: 0 },
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

saleSchema.index({ createdAt: -1 });

export default mongoose.model('Sale', saleSchema);

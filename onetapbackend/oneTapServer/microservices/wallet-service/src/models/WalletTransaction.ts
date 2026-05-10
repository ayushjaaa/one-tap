import mongoose, { Schema, Document } from 'mongoose';

export interface IWalletTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

const WalletTransactionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);

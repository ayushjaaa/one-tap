import mongoose, { Schema, Document } from 'mongoose';

export interface ISipTransaction extends Document {
  sipId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'processing';
  penaltyApplied: boolean;
  createdAt: Date;
}

const SipTransactionSchema: Schema = new Schema(
  {
    sipId: { type: Schema.Types.ObjectId, ref: 'SipPlan', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'processing'],
      default: 'pending',
    },
    penaltyApplied: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<ISipTransaction>('SipTransaction', SipTransactionSchema);

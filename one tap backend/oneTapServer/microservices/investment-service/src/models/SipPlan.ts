import mongoose, { Schema, Document } from 'mongoose';

export interface ISipPlan extends Document {
  userId: mongoose.Types.ObjectId;
  monthlyAmount: number;
  debitDay: number;
  startDate: Date;
  durationMonths: number;
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  nextDebitDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SipPlanSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    monthlyAmount: { type: Number, required: true },
    debitDay: { type: Number, required: true, min: 1, max: 28 },
    startDate: { type: Date, required: true },
    durationMonths: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'paused'],
      default: 'active',
    },
    nextDebitDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ISipPlan>('SipPlan', SipPlanSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IBid extends Document {
  userId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  createdAt: Date;
}

const BidSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'won', 'lost', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IBid>('Bid', BidSchema);

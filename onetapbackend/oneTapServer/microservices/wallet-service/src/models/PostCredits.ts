import mongoose, { Schema, Document } from 'mongoose';

export interface IPostCredits extends Document {
  userId: mongoose.Types.ObjectId;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostCreditsSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalCredits: { type: Number, default: 0 },
    usedCredits: { type: Number, default: 0 },
    remainingCredits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IPostCredits>('PostCredits', PostCreditsSchema);

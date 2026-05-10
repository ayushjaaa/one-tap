import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  description: string;
  location: {
    address?: string;
    city?: string;
    geo?: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  investmentRange: {
    min: number;
    max: number;
  };
  expectedReturn: {
    min: number;
    max: number;
  };
  currentHighestBid: number;
  highestBidUserId?: mongoose.Types.ObjectId;
  bidEndTime: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: {
      address: String,
      city: String,
      geo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' },
      },
    },
    investmentRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    expectedReturn: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    currentHighestBid: { type: Number, default: 0 },
    highestBidUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    bidEndTime: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IProperty>('Property', PropertySchema);

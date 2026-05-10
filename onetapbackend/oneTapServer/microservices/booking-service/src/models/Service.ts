import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  vendorId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  price: number;
  location: {
    city?: string;
    geo?: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  portfolio: string[];
  rating: {
    avg: number;
    count: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    location: {
      city: String,
      geo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' },
      },
    },
    portfolio: [{ type: String }],
    rating: {
      avg: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IService>('Service', ServiceSchema);

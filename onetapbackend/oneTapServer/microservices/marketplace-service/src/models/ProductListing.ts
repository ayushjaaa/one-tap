import mongoose, { Schema, Document } from 'mongoose';

export interface IProductListing extends Document {
  sellerId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  price: number;
  images: string[];
  status: 'available' | 'sold' | 'hidden';
  stats: {
    views: number;
    favorites: number;
  };
  rating: {
    avg: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductListingSchema: Schema = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ['available', 'sold', 'hidden'],
      default: 'available',
    },
    stats: {
      views: { type: Number, default: 0 },
      favorites: { type: Number, default: 0 },
    },
    rating: {
      avg: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProductListing>('ProductListing', ProductListingSchema);

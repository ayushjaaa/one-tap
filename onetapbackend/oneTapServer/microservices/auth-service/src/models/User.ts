import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  phone: string;
  email: string;
  googleId?: string;
  role: 'user' | 'vendor' | 'seller' | 'admin';
  location: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    geo: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  aadhaarVerified: boolean;
  isSellerApproved: boolean;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, unique: true, sparse: true },
    role: {
      type: String,
      enum: ['user', 'vendor', 'seller', 'admin'],
      default: 'user',
    },
    location: {
      address: String,
      city: String,
      state: String,
      pincode: String,
      geo: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], index: '2dsphere' },
      },
    },
    aadhaarVerified: { type: Boolean, default: false },
    isSellerApproved: { type: Boolean, default: false },
    interests: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);

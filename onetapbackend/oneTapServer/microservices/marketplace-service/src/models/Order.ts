import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  buyerId: mongoose.Types.ObjectId;
  listingId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  price: number;
  paymentMethod: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'ProductListing', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    price: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);

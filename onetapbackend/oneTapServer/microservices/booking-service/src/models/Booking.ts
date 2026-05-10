import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  scheduledAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    scheduledAt: { type: Date, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>('Booking', BookingSchema);

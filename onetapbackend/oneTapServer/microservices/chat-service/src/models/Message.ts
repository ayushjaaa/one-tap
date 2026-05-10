import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  message: string;
  type: 'text' | 'image' | 'file';
  isRead: boolean;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IMessage>('Message', MessageSchema);

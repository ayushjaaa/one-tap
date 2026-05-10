import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  parentId?: mongoose.Types.ObjectId;
  level: number;
  path?: string;
  createdAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    level: { type: Number, default: 0 },
    path: { type: String }, // e.g., ",parentID,childID,"
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<ICategory>('Category', CategorySchema);

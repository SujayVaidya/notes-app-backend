import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICategory extends Document {
  userId: Types.ObjectId;
  name: string;
  isDefault: boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

categorySchema.index({ userId: 1, name: 1 });

export const Category = mongoose.model<ICategory>('Category', categorySchema);

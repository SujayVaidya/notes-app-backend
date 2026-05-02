import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  supabaseId: string;
  email: string;
}

const userSchema = new Schema<IUser>(
  {
    supabaseId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, index: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);

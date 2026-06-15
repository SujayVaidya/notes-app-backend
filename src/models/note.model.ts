import mongoose, { Document, Schema, Types } from 'mongoose';

export type NoteType = 'text' | 'markdown';

export interface INote extends Document {
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  title: string;
  noteType: NoteType;
  markdownContent: string;
  plainTextContent: string;
}

const noteSchema = new Schema<INote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    noteType: { type: String, enum: ['text', 'markdown'], required: true, immutable: true },
    markdownContent: { type: String, default: '' },
    plainTextContent: { type: String, default: '' },
  },
  { timestamps: true }
);

noteSchema.index({ userId: 1, categoryId: 1 });
noteSchema.index({ userId: 1, updatedAt: -1 });
noteSchema.index({ title: 'text', plainTextContent: 'text' });

export const Note = mongoose.model<INote>('Note', noteSchema);

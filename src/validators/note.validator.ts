import { z } from 'zod';

export const createNoteSchema = z
  .object({
    title: z.string().min(1).max(150),
    categoryId: z.string().min(1),
    noteType: z.enum(['text', 'markdown']),
    markdownContent: z.string().optional(),
    plainTextContent: z.string().optional(),
  })
  .refine(
    (data) =>
      data.noteType === 'markdown'
        ? data.markdownContent !== undefined
        : data.plainTextContent !== undefined,
    { message: 'Content field must match noteType' }
  );

export const updateNoteSchema = z.object({
  title: z.string().max(150).optional(),
  markdownContent: z.string().optional(),
  plainTextContent: z.string().optional(),
});

export const moveNoteSchema = z.object({
  categoryId: z.string().min(1),
});

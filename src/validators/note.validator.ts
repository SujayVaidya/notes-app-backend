import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z.string().min(1).max(150),
  markdownContent: z.string().min(1),
  categoryId: z.string().min(1),
});

export const updateNoteSchema = z.object({
  title: z.string().max(150).optional(),
  markdownContent: z.string().min(1).optional(),
});

export const moveNoteSchema = z.object({
  categoryId: z.string().min(1),
});

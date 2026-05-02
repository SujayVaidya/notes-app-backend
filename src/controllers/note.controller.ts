import { Request, Response } from 'express';
import { noteService } from '../services/note.service';
import { asyncHandler } from '../utils/asyncHandler';
import { MESSAGES } from '../constants/messages';

export const getNotes = asyncHandler(async (req: Request, res: Response) => {
  const result = await noteService.getAll(req.user!.userId, req.query);
  res.status(200).json({ success: true, ...result });
});

export const getNote = asyncHandler(async (req: Request, res: Response) => {
  const data = await noteService.getOne(req.user!.userId, String(req.params.id));
  res.status(200).json({ success: true, data });
});

export const createNote = asyncHandler(async (req: Request, res: Response) => {
  const note = await noteService.create(req.user!.userId, req.body);
  res.status(201).json({
    success: true,
    message: MESSAGES.NOTE.CREATED,
    data: { _id: note._id, title: note.title },
  });
});

export const updateNote = asyncHandler(async (req: Request, res: Response) => {
  await noteService.update(req.user!.userId, String(req.params.id), req.body);
  res.status(200).json({ success: true, message: MESSAGES.NOTE.UPDATED });
});

export const deleteNote = asyncHandler(async (req: Request, res: Response) => {
  await noteService.remove(req.user!.userId, String(req.params.id));
  res.status(200).json({ success: true, message: MESSAGES.NOTE.DELETED });
});

export const moveNote = asyncHandler(async (req: Request, res: Response) => {
  await noteService.move(req.user!.userId, String(req.params.id), req.body.categoryId);
  res.status(200).json({ success: true, message: MESSAGES.NOTE.MOVED });
});

export const searchNotes = asyncHandler(async (req: Request, res: Response) => {
  const result = await noteService.search(req.user!.userId, req.query);
  res.status(200).json({ success: true, ...result });
});

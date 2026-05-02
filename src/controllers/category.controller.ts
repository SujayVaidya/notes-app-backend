import { Request, Response } from 'express';
import { categoryService } from '../services/category.service';
import { asyncHandler } from '../utils/asyncHandler';
import { MESSAGES } from '../constants/messages';

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.getAll(req.user!.userId);
  res.status(200).json({ success: true, data });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = await categoryService.create(req.user!.userId, req.body.name);
  res.status(201).json({ success: true, message: MESSAGES.CATEGORY.CREATED, data });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.update(req.user!.userId, String(req.params.id), req.body.name);
  res.status(200).json({ success: true, message: MESSAGES.CATEGORY.UPDATED });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.remove(req.user!.userId, String(req.params.id));
  res.status(200).json({ success: true, message: MESSAGES.CATEGORY.DELETED });
});

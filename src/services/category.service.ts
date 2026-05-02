import { Category, ICategory } from '../models/category.model';
import { Note } from '../models/note.model';
import { MESSAGES } from '../constants/messages';

const makeError = (message: string, statusCode: number) =>
  Object.assign(new Error(message), { statusCode });

const getAll = async (userId: string): Promise<ICategory[]> =>
  Category.find({ userId }).sort({ createdAt: 1 });

const create = async (userId: string, name: string): Promise<ICategory> =>
  Category.create({ userId, name });

const update = async (userId: string, categoryId: string, name: string): Promise<ICategory> => {
  const category = await Category.findOne({ _id: categoryId, userId });
  if (!category) throw makeError(MESSAGES.CATEGORY.NOT_FOUND, 404);
  category.name = name;
  return category.save();
};

const remove = async (userId: string, categoryId: string): Promise<void> => {
  const category = await Category.findOne({ _id: categoryId, userId });
  if (!category) throw makeError(MESSAGES.CATEGORY.NOT_FOUND, 404);
  if (category.isDefault) throw makeError(MESSAGES.CATEGORY.DEFAULT_DELETE, 400);

  const general = await Category.findOne({ userId, isDefault: true });
  if (general) {
    await Note.updateMany({ categoryId, userId }, { categoryId: general._id });
  }

  await category.deleteOne();
};

export const categoryService = { getAll, create, update, remove };

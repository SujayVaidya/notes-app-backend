import { Note, INote } from '../models/note.model';
import { Category } from '../models/category.model';
import { extractPlainText } from '../utils/extractPlainText';
import { parsePagination, buildPagination } from '../utils/pagination';
import { MESSAGES } from '../constants/messages';

const makeError = (message: string, statusCode: number) =>
  Object.assign(new Error(message), { statusCode });

interface CreateNoteInput {
  title: string;
  markdownContent: string;
  categoryId: string;
}

interface UpdateNoteInput {
  title?: string;
  markdownContent?: string;
}

const getAll = async (userId: string, query: Record<string, unknown>) => {
  const { page, limit } = parsePagination(query);
  const filter: Record<string, unknown> = { userId };
  if (query.categoryId) filter.categoryId = query.categoryId;

  const sortField = (query.sort as string) || '-updatedAt';
  const [notes, total] = await Promise.all([
    Note.find(filter).select('-markdownContent').sort(sortField).skip((page - 1) * limit).limit(limit),
    Note.countDocuments(filter),
  ]);

  return { data: notes, pagination: buildPagination(total, page, limit) };
};

const getOne = async (userId: string, noteId: string): Promise<INote> => {
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) throw makeError(MESSAGES.NOTE.NOT_FOUND, 404);
  return note;
};

const create = async (userId: string, input: CreateNoteInput): Promise<INote> => {
  const category = await Category.findOne({ _id: input.categoryId, userId });
  if (!category) throw makeError(MESSAGES.CATEGORY.NOT_FOUND, 404);
  return Note.create({ userId, ...input, plainTextContent: extractPlainText(input.markdownContent) });
};

const update = async (userId: string, noteId: string, input: UpdateNoteInput): Promise<INote> => {
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) throw makeError(MESSAGES.NOTE.NOT_FOUND, 404);

  if (input.title !== undefined) note.title = input.title;
  if (input.markdownContent !== undefined) {
    note.markdownContent = input.markdownContent;
    note.plainTextContent = extractPlainText(input.markdownContent);
  }

  return note.save();
};

const remove = async (userId: string, noteId: string): Promise<void> => {
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) throw makeError(MESSAGES.NOTE.NOT_FOUND, 404);
  await note.deleteOne();
};

const move = async (userId: string, noteId: string, categoryId: string): Promise<void> => {
  const [note, category] = await Promise.all([
    Note.findOne({ _id: noteId, userId }),
    Category.findOne({ _id: categoryId, userId }),
  ]);
  if (!note) throw makeError(MESSAGES.NOTE.NOT_FOUND, 404);
  if (!category) throw makeError(MESSAGES.CATEGORY.NOT_FOUND, 404);
  note.categoryId = category._id;
  await note.save();
};

const search = async (userId: string, query: Record<string, unknown>) => {
  const { page, limit } = parsePagination(query);
  const searchText = String(query.query || '');
  const filter: Record<string, unknown> = { userId };
  if (searchText) filter.$text = { $search: searchText };

  const [notes, total] = await Promise.all([
    Note.find(filter).select('-markdownContent').skip((page - 1) * limit).limit(limit),
    Note.countDocuments(filter),
  ]);

  return { data: notes, pagination: buildPagination(total, page, limit) };
};

export const noteService = { getAll, getOne, create, update, remove, move, search };

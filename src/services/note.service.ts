import { Note, INote, NoteType } from '../models/note.model';
import { Category } from '../models/category.model';
import { extractPlainText } from '../utils/extractPlainText';
import { parsePagination, buildPagination } from '../utils/pagination';
import { MESSAGES } from '../constants/messages';

const makeError = (message: string, statusCode: number) =>
  Object.assign(new Error(message), { statusCode });

interface CreateNoteInput {
  title: string;
  categoryId: string;
  noteType: NoteType;
  markdownContent?: string;
  plainTextContent?: string;
}

interface UpdateNoteInput {
  title?: string;
  markdownContent?: string;
  plainTextContent?: string;
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

  const fields: Record<string, unknown> = { userId, title: input.title, categoryId: input.categoryId, noteType: input.noteType };
  if (input.noteType === 'markdown') {
    fields.markdownContent = input.markdownContent ?? '';
    fields.plainTextContent = extractPlainText(input.markdownContent ?? '');
  } else {
    fields.plainTextContent = input.plainTextContent ?? '';
  }

  return Note.create(fields);
};

const update = async (userId: string, noteId: string, input: UpdateNoteInput): Promise<INote> => {
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) throw makeError(MESSAGES.NOTE.NOT_FOUND, 404);

  if (input.title !== undefined) note.title = input.title;
  if (note.noteType === 'markdown' && input.markdownContent !== undefined) {
    note.markdownContent = input.markdownContent;
    note.plainTextContent = extractPlainText(input.markdownContent);
  } else if (note.noteType === 'text' && input.plainTextContent !== undefined) {
    note.plainTextContent = input.plainTextContent;
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
  if (searchText) filter.title = { $regex: searchText, $options: 'i' };

  const [notes, total] = await Promise.all([
    Note.find(filter).select('-markdownContent').skip((page - 1) * limit).limit(limit),
    Note.countDocuments(filter),
  ]);

  return { data: notes, pagination: buildPagination(total, page, limit) };
};

export const noteService = { getAll, getOne, create, update, remove, move, search };

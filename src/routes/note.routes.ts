import { Router } from 'express';
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  moveNote,
  searchNotes,
} from '../controllers/note.controller';
import { validate } from '../middleware/validate.middleware';
import { createNoteSchema, updateNoteSchema, moveNoteSchema } from '../validators/note.validator';

const router = Router();

router.get('/search', searchNotes);
router.get('/', getNotes);
router.get('/:id', getNote);
router.post('/', validate(createNoteSchema), createNote);
router.patch('/:id', validate(updateNoteSchema), updateNote);
router.delete('/:id', deleteNote);
router.patch('/:id/move', validate(moveNoteSchema), moveNote);

export default router;

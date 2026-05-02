import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import categoryRoutes from './category.routes';
import noteRoutes from './note.routes';

const router = Router();

router.use('/categories', authMiddleware, categoryRoutes);
router.use('/notes', authMiddleware, noteRoutes);

export default router;

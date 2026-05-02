import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ROUTES } from './constants/routes';
import healthRoutes from './routes/health.routes';
import apiRoutes from './routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(ROUTES.HEALTH, healthRoutes);
app.use(ROUTES.BASE, apiRoutes);

app.use(errorMiddleware);

export default app;

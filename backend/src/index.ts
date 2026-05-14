import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import ragazziRoutes from './routes/ragazzi';
import tasksRoutes from './routes/tasks';
import taskTemplatesRoutes from './routes/taskTemplates';
import reportsRoutes from './routes/reports';
import photosRoutes from './routes/photos';
import commitmentsRoutes from './routes/commitments';
import notificationsRoutes from './routes/notifications';
import transcribeRoutes from './routes/transcribe';
import weeklyActivitiesRoutes from './routes/weeklyActivities';
import washingMachineRoutes from './routes/washingMachine';
import exportPdfRoutes from './routes/exportPdf';

const app = express();
const PORT = process.env.PORT ?? 3001;
const HOST = process.env.HOST ?? '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/ragazzi', authMiddleware, ragazziRoutes);
app.use('/api/tasks', authMiddleware, tasksRoutes);
app.use('/api/task-templates', authMiddleware, taskTemplatesRoutes);
app.use('/api/commitments', authMiddleware, commitmentsRoutes);
app.use('/api/notifications', authMiddleware, notificationsRoutes);
app.use('/api/weekly-activities', authMiddleware, weeklyActivitiesRoutes);

// Nested routes under ragazzi
app.use('/api/ragazzi', authMiddleware, reportsRoutes);
app.use('/api/ragazzi', authMiddleware, photosRoutes);
app.use('/api/transcribe', authMiddleware, transcribeRoutes);
app.use('/api/washing-machine', authMiddleware, washingMachineRoutes);
app.use('/api/export-pdf', authMiddleware, exportPdfRoutes);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Diaconia API running on http://${HOST}:${PORT}`);
});

export default app;

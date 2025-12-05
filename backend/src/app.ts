import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from './routes/health.routes';
import incidentRoutes from './routes/incident.routes';
import oncallRoutes from './routes/oncall.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1/', healthRoutes);
app.use('/api/v1/', incidentRoutes);
app.use('/api/v1/', oncallRoutes);

export default app;
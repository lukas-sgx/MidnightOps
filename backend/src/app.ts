import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from './routes/health.routes';
import incidentRoutes from './routes/incident.routes';
import oncallRoutes from './routes/oncall.routes';
import teamsRoutes from './routes/teams.routes';
import loginRoutes from './middlewares/login.routes';
import verifyRoutes from './middlewares/verify.routes';
import meRoutes from './routes/me.routes';
import metricRoutes from './routes/metrics.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1/', healthRoutes);
app.use('/api/v1/', incidentRoutes);
app.use('/api/v1/', oncallRoutes);
app.use('/api/v1/', teamsRoutes);
app.use('/api/v1/', meRoutes);  
app.use('/api/v1/', metricRoutes);  

app.use('/api/v1/auth/', loginRoutes);
app.use('/api/v1/auth/', verifyRoutes);

export default app;
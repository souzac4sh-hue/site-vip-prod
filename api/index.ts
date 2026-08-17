import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiRouter } from '../server/routes/api.js';
import { antiBotMiddleware } from '../server/middleware/antiBot.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Anti-Bot Session Layer
app.use(antiBotMiddleware);

// API Routes
app.use('/api', apiRouter);

export default app;

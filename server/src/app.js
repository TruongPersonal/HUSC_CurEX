import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './database/db.js';
import authRoutes from './routes/auth.routes.js';
import marketRoutes from './routes/market.routes.js';
import postRoutes from './routes/post.routes.js';
import unitRoutes from './routes/unit.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import dataRoutes from './routes/data.routes.js';
import userRoutes from './routes/user.routes.js';
import reportRoutes from './routes/report.routes.js';
import documentRoutes from './routes/document.routes.js';
import studentDocRoutes from './routes/studentDoc.routes.js';
import statsRoutes from './routes/stats.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'))); // Serve static files

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/student-docs', studentDocRoutes);
app.use('/api/stats', statsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to HUSC CurEX API' });
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({ status: 'Database connected', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'Database connection failed', error: err.message });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

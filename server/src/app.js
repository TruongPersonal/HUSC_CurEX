import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './database/db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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

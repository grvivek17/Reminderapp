require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);     // /api/users endpoint lives in auth routes
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

// Start server
async function start() {
  try {
    await db.initialize();
    app.listen(PORT, () => {
      console.log(`Reminder backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await db.close();
  process.exit(0);
});

start();

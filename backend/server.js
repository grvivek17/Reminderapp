require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);     // /api/users endpoint lives in auth routes
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

// Start server
async function runMigrations() {
  const migrations = [
    'ALTER TABLE reminder_tasks ADD location_text VARCHAR2(500)',
    'ALTER TABLE reminder_tasks ADD location_lat NUMBER',
    'ALTER TABLE reminder_tasks ADD location_lng NUMBER'
  ];
  for (const sql of migrations) {
    try {
      await db.execute(sql);
      console.log('Migration applied:', sql.substring(0, 60));
    } catch (err) {
      // ORA-01430: column already exists - safe to ignore
      if (err.errorNum !== 1430) {
        console.error('Migration warning:', err.message);
      }
    }
  }
}

async function start() {
  try {
    await db.initialize();
    await runMigrations();
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

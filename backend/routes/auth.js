const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

const AVATAR_COLORS = [
  '#4f6ef7','#e74c8b','#22c55e','#f59e0b','#8b5cf6',
  '#0ea5e9','#ef4444','#14b8a6','#f97316','#6366f1',
];

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if email exists
    const existing = await db.execute(
      'SELECT id FROM reminder_users WHERE LOWER(email) = LOWER(:email)',
      { email }
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Pick color based on current user count
    const countResult = await db.execute('SELECT COUNT(*) AS cnt FROM reminder_users');
    const userCount = countResult.rows[0].CNT || 0;
    const color = AVATAR_COLORS[userCount % AVATAR_COLORS.length];

    // Insert user
    const result = await db.execute(
      `INSERT INTO reminder_users (name, email, password_hash, color)
       VALUES (:name, :email, :passwordHash, :color)
       RETURNING id INTO :id`,
      {
        name,
        email: email.toLowerCase(),
        passwordHash,
        color,
        id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER },
      }
    );

    const userId = result.outBinds.id[0];
    const token = jwt.sign({ id: userId, email: email.toLowerCase(), name }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: { id: userId, name, email: email.toLowerCase(), color, createdAt: new Date().toISOString() },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await db.execute(
      'SELECT id, name, email, password_hash, color, created_at FROM reminder_users WHERE LOWER(email) = LOWER(:email)',
      { email }
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.ID, email: user.EMAIL, name: user.NAME },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.ID,
        name: user.NAME,
        email: user.EMAIL,
        color: user.COLOR,
        createdAt: user.CREATED_AT,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me -- validate token & return user
router.get('/me', auth, async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT id, name, email, color, created_at FROM reminder_users WHERE id = :id',
      { id: req.user.id }
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const u = result.rows[0];
    res.json({ id: u.ID, name: u.NAME, email: u.EMAIL, color: u.COLOR, createdAt: u.CREATED_AT });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users -- list all users (for assignment picker)
router.get('/users', auth, async (req, res) => {
  try {
    const result = await db.execute(
      'SELECT id, name, email, color FROM reminder_users ORDER BY name'
    );
    res.json(result.rows.map(u => ({
      id: u.ID, name: u.NAME, email: u.EMAIL, color: u.COLOR,
    })));
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auth/users/:id -- remove a user (cannot delete self)
router.delete('/users/:id', auth, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Remove user's task assignments
    await db.execute(
      'DELETE FROM reminder_task_assignments WHERE user_id = :userId',
      { userId: targetId }
    );

    // Delete user
    const result = await db.execute(
      'DELETE FROM reminder_users WHERE id = :id',
      { id: targetId }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

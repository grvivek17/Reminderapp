const jwt = require('jsonwebtoken');
const db = require('../db');

const AVATAR_COLORS = [
  '#4f6ef7','#e74c8b','#22c55e','#f59e0b','#8b5cf6',
  '#0ea5e9','#ef4444','#14b8a6','#f97316','#6366f1',
];

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const existing = await db.execute(
      'SELECT id, name, email, color FROM reminder_users WHERE id = :id',
      { id: decoded.id }
    );

    if (existing.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = {
      id: existing.rows[0].ID,
      name: existing.rows[0].NAME,
      email: existing.rows[0].EMAIL,
      color: existing.rows[0].COLOR
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('JWT Verification error:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = auth;

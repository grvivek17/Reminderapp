const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const db = require('../db');

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8081';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'master';

/*
const client = jwksClient({
  jwksUri: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) {
      console.error('Failed to get signing key:', err.message);
      return callback(err);
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}
*/

const AVATAR_COLORS = [
  '#4f6ef7','#e74c8b','#22c55e','#f59e0b','#8b5cf6',
  '#0ea5e9','#ef4444','#14b8a6','#f97316','#6366f1',
];

async function auth(req, res, next) {
  /*
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split(' ')[1];

  jwt.verify(token, getKey, {
    algorithms: ['RS256']
  }, async (err, decoded) => {
    if (err) {
      console.error('JWT Verification error:', err.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
  */
    try {
      // TEMPORARY MOCK FOR BYPASSING KEYCLOAK
      const email = 'mockuser@example.com';
      const name = 'Mock User';

      const existing = await db.execute(
        'SELECT id, name, email, color FROM reminder_users WHERE LOWER(email) = :email',
        { email }
      );

      let user;
      if (existing.rows.length > 0) {
        user = {
          id: existing.rows[0].ID,
          name: existing.rows[0].NAME,
          email: existing.rows[0].EMAIL,
          color: existing.rows[0].COLOR
        };
      } else {
        const countResult = await db.execute('SELECT COUNT(*) AS cnt FROM reminder_users');
        const userCount = countResult.rows[0].CNT || 0;
        const color = AVATAR_COLORS[userCount % AVATAR_COLORS.length];

        const result = await db.execute(
          `INSERT INTO reminder_users (name, email, password_hash, color)
           VALUES (:name, :email, :passwordHash, :color)
           RETURNING id INTO :id`,
          {
            name,
            email,
            passwordHash: 'SSO_USER',
            color,
            id: { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER },
          }
        );
        user = {
          id: result.outBinds.id[0],
          name,
          email,
          color
        };
      }

      req.user = user;
      next();
    } catch (dbErr) {
      console.error('DB Sync Error in Auth Middleware:', dbErr);
      return res.status(500).json({ error: 'Internal server error' });
    }
  /*
  });
  */
}

module.exports = auth;

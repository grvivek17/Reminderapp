const ADMIN_EMAIL = 'grvivek17@gmail.com';

function isAdmin(req) {
  return req.user && req.user.email && req.user.email.toLowerCase() === ADMIN_EMAIL;
}

function adminOnly(req, res, next) {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { ADMIN_EMAIL, isAdmin, adminOnly };

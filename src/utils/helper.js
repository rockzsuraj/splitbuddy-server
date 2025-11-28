const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Generate secure state token
function generateStateToken() {
  return crypto.randomBytes(32).toString('hex');
}


function sanitizeUser(user) {
  if (!user) return null;
  const { password, refresh_token, ...safeUser } = user;
  return safeUser;
}

// Helper: get remaining TTL (in seconds) from token
function getTokenTtlSeconds(token) {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) return 0;
  const expMs = decoded.exp * 1000;
  const nowMs = Date.now();
  const diffSec = Math.floor((expMs - nowMs) / 1000);
  return diffSec > 0 ? diffSec : 0;
}

module.exports = {
  sanitizeUser,
  generateStateToken,
  getTokenTtlSeconds
};

const crypto = require('crypto');

// Generate secure state token
function generateStateToken() {
  return crypto.randomBytes(32).toString('hex');
}


function sanitizeUser(user) {
  if (!user) return null;
  const { password, refresh_token, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  sanitizeUser,
  generateStateToken
};
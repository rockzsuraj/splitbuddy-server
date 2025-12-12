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

// 🔹 From balances -> who should pay whom
function calculateRecommendedSettlements(balances = []) {
  const creditors = []; // +ve balance => should receive
  const debtors = [];   // -ve balance => should pay

  for (const b of balances) {
    const balNum = Number(b.balance);

    if (balNum > 0) {
      creditors.push({ ...b, remaining: balNum });
    } else if (balNum < 0) {
      debtors.push({ ...b, remaining: -balNum }); // store positive amount
    }
  }

  creditors.sort((a, b) => b.remaining - a.remaining);
  debtors.sort((a, b) => b.remaining - a.remaining);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.remaining, creditor.remaining);

    if (amount > 0.000001) {
      settlements.push({
        from_user_id: debtor.id,
        to_user_id: creditor.id,
        amount: Number(amount.toFixed(2)),
      });
    }

    debtor.remaining -= amount;
    creditor.remaining -= amount;

    if (debtor.remaining <= 0.000001) i++;
    if (creditor.remaining <= 0.000001) j++;
  }

  return settlements;
}


module.exports = {
  sanitizeUser,
  generateStateToken,
  getTokenTtlSeconds,
  calculateRecommendedSettlements
};


require('dotenv').config();
const db = require('../src/config/database');

(async () => {
  try {
    const res = await db.executeQuery('SELECT NOW() AS now');
    console.log('DB OK:', res.rows ? res.rows[0] : res);
    process.exit(0);
  } catch (err) {
    console.error('DB ERROR:', err);
    process.exit(1);
  }
})();
const serverless = require('serverless-http');
const app = require('../app');

// NO database initialization here - let it happen on first request
// This prevents cold start timeouts

module.exports = serverless(app);
const serverless = require('serverless-http');
const app = require('../../app');

// serverless-http returns a handler compatible with Netlify Functions
module.exports.handler = serverless(app);
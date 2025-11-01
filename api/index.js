// api/index.js
const serverless = require('serverless-http');
const app = require('../app');

// Add timeout handling
const handler = serverless(app, {
  callbackWaitsForEmptyEventLoop: false // Important for DB connections
});

module.exports = async (req, res) => {
  try {
    const response = await Promise.race([
      handler(req, res),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Handler timeout')), 8000)
      )
    ]);
    return response;
  } catch (error) {
    return {
      statusCode: 504,
      body: JSON.stringify({ error: 'Gateway timeout' })
    };
  }
};
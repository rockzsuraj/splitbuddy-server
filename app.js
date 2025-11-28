const express = require('express');
const routes = require('./src/routes');
const { errorHandler } = require('./src/utils/apiError');
const configureMiddleware = require('./src/config/middleware');
const path = require('path');
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));



// Example: Cache middleware to check Redis cache
async function cacheMiddleware(req, res, next) {
  const key = req.originalUrl;
  const cachedData = await redisClient.get(key);

  if (cachedData) {
    return res.json(JSON.parse(cachedData));
  }
  next();
}

configureMiddleware(app);

app.get('/data', cacheMiddleware, async (req, res) => {
  const data = { message: 'This is data to cache' };
  await redisClient.setEx(req.originalUrl, 3600, JSON.stringify(data)); // Cache for 1 hour
  res.json(data);
});


// Root route - NO DB calls here
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'API is running 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint without DB
app.post('/test', (req, res) => {
  res.json({ ok: true, data: req.body });
});

// Health check with DB test (but don't block startup)
app.get('/health', async (req, res) => {
  try {
    const { testConnection } = require('./src/config/database');
    const dbStatus = await testConnection();

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(200).json({
      status: 'DEGRADED',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// API routes
app.use('/api', routes);

// Error handler LAST
app.use(errorHandler);

module.exports = app;
const express = require('express');
const routes = require('./src/routes');
const { errorHandler } = require('./src/utils/apiError');

const app = express();

// Middleware FIRST
// ✅ FIX: Configure body parser with limits and verification
app.use(express.json({
  limit: '10mb', // Set reasonable limit
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf); // Verify JSON is valid
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 10000 // Increase if you have many form fields
}));

// ✅ FIX: Add raw body handling for specific routes if needed
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'DELETE') {
    // Skip body parsing for GET/DELETE requests
    return next();
  }
  next();
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
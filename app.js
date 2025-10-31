const express = require('express');
const routes = require('./src/routes');
const { errorHandler } = require('./src/utils/apiError');

const app = express();

app.use((req, res, next) => {
  // Skip body parsing for GET, HEAD, OPTIONS, DELETE requests
  if (['GET', 'HEAD', 'OPTIONS', 'DELETE'].includes(req.method)) {
    return next();
  }
  
  // Only parse JSON for POST, PUT, PATCH requests
  if (req.headers['content-type'] === 'application/json') {
    return express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        try {
          if (buf && buf.length > 0) {
            JSON.parse(buf);
          }
        } catch (e) {
          throw new Error('Invalid JSON');
        }
      }
    })(req, res, next);
  }
  
  // Parse URL-encoded for form submissions
  return express.urlencoded({
    extended: true,
    limit: '10mb'
  })(req, res, next);
});

// ✅ FIX: Add middleware to handle empty bodies
app.use((req, res, next) => {
  // If it's a GET request, explicitly set body to undefined
  if (req.method === 'GET' || req.method === 'DELETE') {
    req.body = undefined;
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
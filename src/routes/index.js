const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const docsRoutes = require('./docs.routes');
const { notFoundHandler } = require('../utils/apiError');
const groupRoutes = require('./group.routes');
const { testConnection } = require('../config/database');


// Health check endpoint

router.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// API routes
router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);
router.use('/v1/groups', groupRoutes);

// Documentation route (only in development)
if (process.env.NODE_ENV === 'development') {
  router.use('/docs', docsRoutes);
}

// Handle 404 Not Found
router.use(notFoundHandler);

module.exports = router;
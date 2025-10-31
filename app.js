const express = require('express');
const routes = require('./src/routes');
const { errorHandler } = require('./src/utils/apiError');

const app = express();

// Middleware FIRST
app.use(express.json());

// In app.js, after express.json()
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'API is running 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.post('/test', (req, res) => {
  console.log('Body:', req.body);
  res.json({ ok: true, data: req.body });
});

// API routes
app.use('/api', routes);

// Error handler LAST
app.use(errorHandler);

module.exports = app;
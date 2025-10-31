const express = require('express');
const path = require('path');
const routes = require('./src/routes');
const docsRouter = require('./src/routes/docs.routes'); // Add this import
const { errorHandler } = require('./src/utils/apiError');
const configureMiddleware = require('./src/config/middleware');
const listEndpoints = require('express-list-endpoints');

const app = express();

// After all routes are defined

// Configure Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Configure middleware
configureMiddleware(app);

// Serve Swagger UI assets
// Add this before other middleware
// Add this before other middleware
app.use('/docs', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Then mount your docs router
app.use('/docs', require('./src/routes/docs.routes'));


// API Documentation Routes
app.use('/docs', docsRouter); // Mount docs router under /docs

// API routes
app.use('/api', routes);
console.log(listEndpoints(app));

// Error handler
app.use(errorHandler);

module.exports = app;
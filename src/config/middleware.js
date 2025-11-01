// const express = require('express');
// const helmet = require('helmet');
// const cors = require('cors');
// const morgan = require('morgan');
// const logger = require('../utils/logger');
// const path = require('path')

// module.exports = (app) => {
//   // Essential middleware
//   app.use(express.static(path.join(__dirname, 'public')));

//   // Security middleware
//   app.use(helmet());
//   // Prevent MIME type sniffing
//   app.use(helmet.noSniff());
//   // Set XSS protection headers
//   app.use(helmet.xssFilter());

//   // CORS configuration
//   app.use(cors({
//     origin: process.env.CORS_ORIGIN || '*',
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//     allowedHeaders: ['Content-Type', 'Authorization']
//   }));

//   // HTTP request logging
//   if (process.env.NODE_ENV !== 'test') {
//     app.use(morgan('combined', {
//       stream: logger.morganStream,
//       skip: (req) => req.originalUrl === '/health' // Skip health checks
//     }));
//   }
// };
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('../utils/logger');
const path = require('path')

module.exports = (app) => {
    // 
    app.use((req, res, next) => {
        // Skip body parsing for GET or HEAD requests
        if (req.method === 'GET' || req.method === 'HEAD') return next();
        express.json()(req, res, (err) => {
            if (err) {
                console.error('JSON parse error:', err.message);
                return res.status(400).json({ error: 'Invalid JSON or content length mismatch' });
            }
            express.urlencoded({ extended: true })(req, res, next);
        });
    });

    // ✅ FIX: Add middleware to handle empty bodies
    app.use((req, res, next) => {
        // If it's a GET request, explicitly set body to undefined
        if (req.method === 'GET' || req.method === 'DELETE') {
            req.body = undefined;
        }
        next();
    });

    // Essential middleware
    app.use(express.static(path.join(__dirname, 'public')));

    // Security middleware
    app.use(helmet());
    // Prevent MIME type sniffing
    app.use(helmet.noSniff());
    // Set XSS protection headers
    app.use(helmet.xssFilter());

    // CORS configuration
    app.use(cors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // HTTP request logging
    if (process.env.NODE_ENV !== 'test') {
        app.use(morgan('combined', {
            stream: logger.morganStream,
            skip: (req) => req.originalUrl === '/health' // Skip health checks
        }));
    }
};
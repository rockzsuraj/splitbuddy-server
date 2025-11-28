// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

// This will use process.env.CLOUDINARY_URL
cloudinary.config({
  secure: process.env.CLOUDINARY_SECURE === 'true',
});

module.exports = cloudinary;

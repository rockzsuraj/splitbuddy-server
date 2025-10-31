const nodemailer = require('nodemailer');
const { ApiError } = require('../utils/apiError');
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, EMAIL_PASSWORD } = require('../config/env');

const sendPasswordResetEmail = async (options) => {
    // Looking to send emails in production? Check out our Email API/SMTP product!
    var transport = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        auth: {
            user: EMAIL_USERNAME,
            pass: EMAIL_PASSWORD
        }
    });
    if (!transport) {
        throw new ApiError(500, 'Email service is not configured properly');
    }
    await transport.sendMail(options);
}

module.exports = {
    sendPasswordResetEmail,
}
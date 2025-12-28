const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

/**
 * Validates an email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} Whether the email address is valid
 */
const validateEmail = (email) => {
    if (!email) return false;
    
    // Simple regex for basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
    
    // For more comprehensive validation, consider using a library like validator.js
    // or implementing a more robust regex pattern
};

const sendSchedulePdf = async (recipientEmail, pdfBuffer, employeeName, subject, message) => {
    try {
        // Validate email first
        if (!validateEmail(recipientEmail)) {
            return {
                success: false,
                error: `Invalid email address: ${recipientEmail}`
            };
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: subject || '',
            text: message || '',
            attachments: [{
                filename: 'schedule.pdf',
                content: pdfBuffer
            }]
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send a simple email without attachments
 * @param {string} recipientEmail - Email address of the recipient
 * @param {string} subject - Subject of the email
 * @param {string} message - Body of the email
 * @param {string} [recipientName] - Optional name of recipient for personalization
 * @returns {Promise<Object>} Result of the email sending operation
 */
const sendEmail = async (recipientEmail, subject, message, recipientName = '') => {
    try {
        // Validate email first
        if (!validateEmail(recipientEmail)) {
            return { 
                success: false, 
                error: `Invalid email address: ${recipientEmail}`
            };
        }

        const formattedMessage = recipientName 
            ? `Hello ${recipientName},\n\n${message}\n\nBest regards,\nManagement`
            : `${message}\n\nBest regards,\nManagement`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: subject,
            text: formattedMessage
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Sends an email with optional attachments
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email body text
 * @param {string} [options.html] - Optional HTML body
 * @param {Array} [options.attachments] - Optional array of attachment objects
 * @returns {Promise<Object>} Result of the email sending operation
 */
const sendFlexibleEmail = async (options) => {
    try {
        if (!options.to || !options.subject) {
            throw new Error('Missing required email fields (to, subject)');
        }

        // Validate email first
        if (!validateEmail(options.to)) {
            return { 
                success: false, 
                error: `Invalid email address: ${options.to}`
            };
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: options.to,
            subject: options.subject,
            text: options.text || '',
        };

        // Add optional fields if they exist
        if (options.html) mailOptions.html = options.html;
        if (options.attachments) mailOptions.attachments = options.attachments;
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

const testEmailConnection = async () => {
    try {
        // Log configuration (but mask most of the password)
        const pass = process.env.EMAIL_PASSWORD || '';
        const maskedPass = pass.length > 4 
            ? pass.substring(0, 2) + '***' + pass.substring(pass.length - 2) 
            : '******';
        
        console.log('Testing connection with:');
        console.log(`- Host: ${process.env.EMAIL_HOST}`);
        console.log(`- Port: ${process.env.EMAIL_PORT || '465'}`);
        console.log(`- User: ${process.env.EMAIL_USER}`);
        console.log(`- Pass: ${maskedPass} (length: ${pass.length})`);
        
        await transporter.verify();
        console.log('Email server connection successful');
        return true;
    } catch (error) {
        console.error('Email server connection failed:', error);
        // If auth error, give a more helpful message
        if (error.message.includes('auth')) {
            console.error('This appears to be an authentication error. Check your username and password.');
            console.error('If your password contains special characters like #, make sure to use quotes in your .env file:');
            console.error('EMAIL_PASSWORD="your#password"');
        }
        return false;
    }
};

module.exports = {
    sendSchedulePdf,
    sendEmail,
    sendFlexibleEmail,
    testEmailConnection,
    validateEmail
};

// Example usage:
// 
// 1. Simple email without attachment:
// sendEmail(
//     'employee@example.com',
//     'Important Announcement',
//     'The office will be closed on Monday for maintenance.',
//     'John Doe'
// );
//
// 2. Flexible email with optional attachment:
// sendFlexibleEmail({
//     to: 'employee@example.com',
//     subject: 'Meeting Agenda',
//     text: 'Please review the attached agenda for tomorrow\'s meeting.',
//     attachments: [
//         {
//             filename: 'agenda.pdf',
//             content: pdfBuffer
//         }
//     ]
// });
//
// 3. Flexible email with HTML content:
// sendFlexibleEmail({
//     to: 'employee@example.com',
//     subject: 'Monthly Newsletter',
//     text: 'Please see our monthly newsletter.',
//     html: '<h1>Monthly Newsletter</h1><p>Welcome to our <b>March edition</b>!</p>'
// });
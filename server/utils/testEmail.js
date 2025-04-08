require('dotenv').config();
const { 
  sendEmail, 
  sendSchedulePdf, 
  sendFlexibleEmail, 
  testEmailConnection 
} = require('./emailHandler');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Function to log success or error messages with colors
const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`)
};

// Test email connection
async function testConnection() {
  log.title('TESTING EMAIL CONNECTION');
  
  try {
    const isConnected = await testEmailConnection();
    if (isConnected) {
      log.success('Email server connection successful');
      return true;
    } else {
      log.error('Email server connection failed');
      return false;
    }
  } catch (error) {
    log.error(`Error testing connection: ${error.message}`);
    return false;
  }
}

// Test simple email without attachment
async function testSimpleEmail(recipientEmail) {
  log.title('TESTING SIMPLE EMAIL');
  
  try {
    const result = await sendEmail(
      recipientEmail,
      'Test Email from Node.js',
      'This is a test email sent from your Node.js application using the sendEmail function.',
      'Test User'
    );
    
    if (result.success) {
      log.success(`Simple email sent successfully. Message ID: ${result.messageId}`);
      return true;
    } else {
      log.error(`Failed to send simple email: ${result.error}`);
      return false;
    }
  } catch (error) {
    log.error(`Error sending simple email: ${error.message}`);
    return false;
  }
}

// Test email with PDF attachment
async function testPdfEmail(recipientEmail) {
  log.title('TESTING EMAIL WITH PDF ATTACHMENT');
  
  // For testing purposes, we'll create a dummy PDF buffer
  // In a real scenario, you would use your actual PDF generation logic
  const dummyPdfPath = path.join(__dirname, 'sample.pdf');
  
  try {
    // Check if a sample.pdf exists in the current directory
    let pdfBuffer;
    
    try {
      // Try to read an existing PDF
      pdfBuffer = fs.readFileSync(dummyPdfPath);
      log.info('Using existing sample.pdf file');
    } catch (err) {
      // If no PDF exists, use a simple buffer as placeholder
      log.warning('No sample.pdf found. Using dummy buffer for testing purposes.');
      log.info('For real testing, place a sample.pdf file in the same directory as this script.');
      pdfBuffer = Buffer.from('This is a dummy PDF content for testing purposes');
    }
    
    const result = await sendSchedulePdf(
      recipientEmail,
      pdfBuffer,
      'Test User',
      'Test Schedule PDF',
      'This is a test email with a PDF attachment sent from your Node.js application.'
    );
    
    if (result.success) {
      log.success(`Email with PDF sent successfully. Message ID: ${result.messageId}`);
      return true;
    } else {
      log.error(`Failed to send PDF email: ${result.error}`);
      return false;
    }
  } catch (error) {
    log.error(`Error sending PDF email: ${error.message}`);
    return false;
  }
}

// Test flexible email with HTML content
async function testFlexibleEmail(recipientEmail) {
  log.title('TESTING FLEXIBLE EMAIL WITH HTML CONTENT');
  
  const htmlContent = `
    <h1>Test HTML Email</h1>
    <p>This is a <strong>test email</strong> with HTML content.</p>
    <p>This demonstrates the flexibility of the sendFlexibleEmail function.</p>
    <ul>
      <li>It supports HTML formatting</li>
      <li>It can include attachments (optional)</li>
      <li>It's highly customizable</li>
    </ul>
    <p>Regards,<br>Your Application</p>
  `;
  
  try {
    const result = await sendFlexibleEmail({
      to: recipientEmail,
      subject: 'Test Flexible Email with HTML',
      text: 'This is a test email with HTML content. If you see this, your email client does not support HTML.',
      html: htmlContent
    });
    
    if (result.success) {
      log.success(`Flexible HTML email sent successfully. Message ID: ${result.messageId}`);
      return true;
    } else {
      log.error(`Failed to send flexible HTML email: ${result.error}`);
      return false;
    }
  } catch (error) {
    log.error(`Error sending flexible HTML email: ${error.message}`);
    return false;
  }
}

// Test flexible email with attachment
async function testFlexibleEmailWithAttachment(recipientEmail) {
  log.title('TESTING FLEXIBLE EMAIL WITH ATTACHMENT');
  
  try {
    // Create a simple text file as an attachment
    const textContent = 'This is a sample text file attachment.\nCreated for testing purposes.';
    const attachmentBuffer = Buffer.from(textContent);
    
    const result = await sendFlexibleEmail({
      to: recipientEmail,
      subject: 'Test Flexible Email with Attachment',
      text: 'This email includes a text file attachment to demonstrate the attachment capability of sendFlexibleEmail.',
      attachments: [
        {
          filename: 'sample.txt',
          content: attachmentBuffer
        }
      ]
    });
    
    if (result.success) {
      log.success(`Flexible email with attachment sent successfully. Message ID: ${result.messageId}`);
      return true;
    } else {
      log.error(`Failed to send flexible email with attachment: ${result.error}`);
      return false;
    }
  } catch (error) {
    log.error(`Error sending flexible email with attachment: ${error.message}`);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.EMAIL_HOST) {
    log.error('Missing required environment variables. Make sure EMAIL_USER, EMAIL_PASSWORD, and EMAIL_HOST are set in your .env file.');
    return;
  }
  
  // Get recipient email from command line argument or use default
  const recipientEmail = process.argv[2] || process.env.TEST_RECIPIENT || process.env.EMAIL_USER;
  
  if (!recipientEmail) {
    log.error('No recipient email provided. Please provide an email address as a command line argument or set TEST_RECIPIENT in your .env file.');
    return;
  }
  
  log.info(`Using recipient email: ${recipientEmail}`);
  
  // Test connection first
  const isConnected = await testConnection();
  if (!isConnected) {
    log.error('Aborting tests due to connection failure.');
    return;
  }
  
  // Run all email tests
  await testSimpleEmail(recipientEmail);
  await testPdfEmail(recipientEmail);
  await testFlexibleEmail(recipientEmail);
  await testFlexibleEmailWithAttachment(recipientEmail);
  
  log.title('ALL TESTS COMPLETED');
}

// Check if this file is being run directly
if (require.main === module) {
  log.title('EMAIL TESTING UTILITY');
  log.info('This script will test all email functions in your emailHandler.js file.');
  log.info('Usage: node testEmail.js [recipient-email]');
  log.info('If no recipient email is provided, it will use TEST_RECIPIENT from .env or fall back to EMAIL_USER');
  
  runTests().catch(error => {
    log.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

// Export test functions for individual use
module.exports = {
  testConnection,
  testSimpleEmail,
  testPdfEmail,
  testFlexibleEmail,
  testFlexibleEmailWithAttachment,
  runTests
};
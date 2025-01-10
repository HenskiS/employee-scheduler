const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');

const loggingMiddleware = (req, res, next) => {
  const timestamp = moment()
    .tz('America/Los_Angeles')
    .format('YYYY-MM-DD HH:mm:ss z');
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip;
  
  // Get user information from JWT if available
  let userInfo = 'unauthenticated';
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userInfo = `user: ${decoded.username}`;
    } catch (error) {
      userInfo = 'invalid-token';
    }
  }

  // Log the request
  console.log(`[${timestamp}] ${method} ${url} - ${userInfo} from ${ip}`);

  // Capture the response status
  const originalSend = res.send;
  res.send = function (body) {
    console.log(`[${timestamp}] Response ${res.statusCode} to ${method} ${url}`);
    return originalSend.call(this, body);
  };

  next();
};

module.exports = loggingMiddleware;
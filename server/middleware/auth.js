// for now, I need this to be a rubber stamp approval so I can check my endpoints with thunderclient
/*const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;


*/
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Always approve the request
  req.user = { id: 'dummy_user_id', username: 'dummy_user' };
  next();
};

module.exports = authMiddleware;
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'No token provided' });

  // Typically authHeader in format "Bearer <token>"
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7, authHeader.length) : authHeader;

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    req.user = decoded;
    next();
  });
};

module.exports = { verifyToken };


const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        return res.status(401).json({ message: 'User belonging to this token no longer exists' });
      }

      if (req.user.isBanned) {
        return res.status(403).json({ message: 'Your account has been banned. Contact support.' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token is invalid or has expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided' });
  }
};

module.exports = { protect };
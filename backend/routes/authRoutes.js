const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { registerUser, loginUser } = require('../controllers/authController');

router.post(
  '/register',
  [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .trim(),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^2547\d{8}$/)
      .withMessage('Phone must be in format 2547XXXXXXXX (e.g. 254712345678)'),
  ],
  registerUser
);

router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  loginUser
);

module.exports = router;
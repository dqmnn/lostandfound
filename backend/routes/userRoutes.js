const express = require('express');
const router = express.Router();
const {
  getMe,
  getAllUsers,
  promoteToAdmin,
  banUser,
  unbanUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/me', protect, getMe);
router.get('/', protect, adminOnly, getAllUsers);
router.put('/promote/:id', protect, adminOnly, promoteToAdmin);
router.put('/ban/:id', protect, adminOnly, banUser);
router.put('/unban/:id', protect, adminOnly, unbanUser);

module.exports = router;
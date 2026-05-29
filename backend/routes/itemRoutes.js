const express = require('express');
const router = express.Router();

const {
  reportLostItem,
  reportFoundItem,
  getLostItems,
  getFoundItems,
  getMyItems
} = require('../controllers/itemController');

const { protect } = require('../middleware/authMiddleware');

// ✅ Add this BEFORE the /:id routes
router.get('/mine', protect, getMyItems);

// Global Feed — public
router.get('/lost',  getLostItems);
router.get('/found', getFoundItems);

// Report items — private
router.post('/lost',  protect, reportLostItem);
router.post('/found', protect, reportFoundItem);

module.exports = router;
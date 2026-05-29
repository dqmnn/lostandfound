const express = require('express');
const router = express.Router();
const { createClaim, getMyClaims } = require('../controllers/claimController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createClaim);
router.get('/mine', protect, getMyClaims);

module.exports = router;
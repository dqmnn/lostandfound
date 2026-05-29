const express = require('express');
const router  = express.Router();
const { mockPay, verifyOtp, getTransaction, getTransactionByItem } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/mock-pay',              protect, mockPay);
router.post('/verify-otp',            protect, verifyOtp);
router.get('/transaction/by-item/:foundItemId', protect, getTransactionByItem);
router.get('/transaction/:claimId',   protect, getTransaction);

module.exports = router;
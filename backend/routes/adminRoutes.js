const express = require('express');
const { getStats, getPendingClaims, reviewClaim, getAllItems, deleteItem, getAllUsers, updateUser } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats',        getStats);
router.get('/items',        getAllItems);
router.delete('/items/:id', deleteItem);
router.get('/users',        getAllUsers);
router.put('/users/:id',    updateUser);

// Claims review queue
router.get('/claims', protect, adminOnly, getPendingClaims);
router.put('/claims/:id', protect, adminOnly, reviewClaim);

module.exports = router;
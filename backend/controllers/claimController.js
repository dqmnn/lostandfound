const Claim = require('../models/Claim');
const Item = require('../models/Item');

// -------------------------------------------------------
// @desc    Create a claim on a found item
// @route   POST /api/claims
// @access  Private
// Body: { foundItemId, lostItemId, message }
// -------------------------------------------------------
const createClaim = async (req, res) => {
  try {
    const { foundItemId, lostItemId, message } = req.body;

    // --- Validate required fields ---
    if (!foundItemId || !lostItemId || !message) {
      return res.status(400).json({
        message: 'foundItemId, lostItemId, and message are required',
      });
    }

    // --- Fetch both items in parallel ---
    const [foundItem, lostItem] = await Promise.all([
      Item.findById(foundItemId),
      Item.findById(lostItemId),
    ]);

    // --- Validate the found item ---
    if (!foundItem) {
      return res.status(404).json({ message: 'Found item not found' });
    }
    if (foundItem.type !== 'found') {
      return res.status(400).json({ message: 'Target item is not a found item' });
    }
    if (foundItem.status !== 'unclaimed') {
      return res.status(400).json({
        message: 'This item is already under review or has been claimed',
      });
    }

    // --- Validate the lost item ---
    if (!lostItem) {
      return res.status(404).json({ message: 'Lost item not found' });
    }
    if (lostItem.type !== 'lost') {
      return res.status(400).json({ message: 'Selected report is not a lost item' });
    }
    if (lostItem.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'You can only use your own lost reports to make a claim',
      });
    }
    if (lostItem.status !== 'searching') {
      return res.status(400).json({
        message: 'This lost report is already matched or resolved',
      });
    }

    // --- Block owner from claiming their own found post ---
    if (foundItem.postedBy.toString() === req.user._id.toString()) {
      return res.status(403).json({
        message: 'You cannot claim an item you reported as found',
      });
    }

    // --- One active claim per found item at a time ---
    const existingClaim = await Claim.findOne({
      foundItem: foundItemId,
      status: { $in: ['pending', 'approved'] },
    });
    if (existingClaim) {
      return res.status(400).json({
        message: 'This item already has an active claim under review',
      });
    }

    // --- Create the claim ---
    const claim = await Claim.create({
      claimant: req.user._id,
      foundItem: foundItemId,
      lostItem: lostItemId,
      message,
    });

    // --- Lock both items atomically ---
    await Promise.all([
      Item.findByIdAndUpdate(foundItemId, { status: 'pending_review' }),
      Item.findByIdAndUpdate(lostItemId, { status: 'claim_pending' }),
    ]);

    res.status(201).json(claim);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------------------------------
// @desc    Get all claims submitted by the logged-in user
// @route   GET /api/claims/mine
// @access  Private
// -------------------------------------------------------
const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ claimant: req.user._id })
      .populate('foundItem', 'title category locationGeneral photo status rewardAmount')
      .populate('lostItem', 'title category status rewardAmount')
      .sort({ createdAt: -1 });

    res.status(200).json(claims);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createClaim, getMyClaims };
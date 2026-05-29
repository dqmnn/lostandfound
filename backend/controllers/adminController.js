const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const Transaction = require('../models/Transaction');

const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalItems,
      lostCount,
      foundCount,
      resolvedCount,
      pendingReviewCount,
      claimPendingCount,
      disputedCount,
    ] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ status: 'resolved' }),
      Item.countDocuments({ status: 'pending_review' }),
      Item.countDocuments({ status: 'claim_pending' }),
      Item.countDocuments({ status: 'disputed' }),
    ]);

    res.status(200).json({
      totalUsers,
      totalItems,
      lostCount,
      foundCount,
      resolvedCount,
      pendingReviewCount,
      claimPendingCount,
      disputedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllItems = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type === 'lost' || req.query.type === 'found') {
      filter.type = req.query.type;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const items = await Item.find(filter)
      .populate('postedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await item.deleteOne();
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { role, isBanned } = req.body;

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot modify your own account here' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role     !== undefined) user.role     = role;
    if (isBanned !== undefined) user.isBanned = isBanned;

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------------------------------
// @desc    Get all pending claims for admin review
// @route   GET /api/admin/claims
// @access  Admin
// -------------------------------------------------------
const getPendingClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ status: 'pending' })
      .populate('claimant', 'name email phone')
      .populate('foundItem')   // full doc — admin sees private fields
      .populate('lostItem')    // full doc
      .sort({ createdAt: 1 }); // oldest first so admin clears the queue in order

    res.status(200).json(claims);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------------------------------
// @desc    Approve or reject a claim (atomic item status update)
// @route   PUT /api/admin/claims/:id
// @access  Admin
// Body: { verdict: 'approved' | 'rejected', adminNote?: string }
// -------------------------------------------------------
/* const reviewClaim = async (req, res) => {
  try {
    const { verdict, adminNote } = req.body;

    if (!verdict || !['approved', 'rejected'].includes(verdict)) {
      return res.status(400).json({
        message: "verdict must be 'approved' or 'rejected'",
      });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    if (claim.status !== 'pending') {
      return res.status(400).json({ message: 'This claim has already been reviewed' });
    }

    // Stamp the review metadata regardless of verdict
    claim.adminNote = adminNote || '';
    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();

    if (verdict === 'approved') {
      claim.status = 'approved';
      await claim.save();

      // Move both items forward and cross-link them
      await Promise.all([
        Item.findByIdAndUpdate(claim.foundItem, {
          status: 'awaiting_payment',
          matchedItemId: claim.lostItem,
        }),
        Item.findByIdAndUpdate(claim.lostItem, {
          status: 'claim_approved',
          matchedItemId: claim.foundItem,
        }),
      ]);
    } else {
      // Rejected — unlock both items so they return to their feeds
      claim.status = 'rejected';
      await claim.save();

      await Promise.all([
        Item.findByIdAndUpdate(claim.foundItem, {
          status: 'unclaimed',
          matchedItemId: null,
        }),
        Item.findByIdAndUpdate(claim.lostItem, {
          status: 'searching',
          matchedItemId: null,
        }),
      ]);
    }

    res.status(200).json(claim);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
 */
const reviewClaim = async (req, res) => {
  try {
    const { verdict, adminNote } = req.body;

    if (!verdict || !['approved', 'rejected'].includes(verdict)) {
      return res.status(400).json({
        message: "verdict must be 'approved' or 'rejected'",
      });
    }

    // Populate both items so we can read rewardAmount and postedBy
    const claim = await Claim.findById(req.params.id)
      .populate('foundItem')
      .populate('lostItem');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    if (claim.status !== 'pending') {
      return res.status(400).json({ message: 'This claim has already been reviewed' });
    }

    claim.adminNote  = adminNote || '';
    claim.reviewedBy = req.user._id;
    claim.reviewedAt = new Date();

    if (verdict === 'approved') {
      claim.status = 'approved';
      await claim.save();

      // Move both items forward and cross-link them
      await Promise.all([
        Item.findByIdAndUpdate(claim.foundItem._id, {
          status:        'awaiting_payment',
          matchedItemId:  claim.lostItem._id,
        }),
        Item.findByIdAndUpdate(claim.lostItem._id, {
          status:        'claim_approved',
          matchedItemId:  claim.foundItem._id,
        }),
      ]);

      // Create the Transaction document now that the claim is approved
      const totalAmount = claim.lostItem.rewardAmount || 0;
      await Transaction.create({
        claimId:     claim._id,
        foundItemId: claim.foundItem._id,
        lostItemId:  claim.lostItem._id,
        ownerId:     claim.claimant,            // person who submitted the claim = owner
        finderId:    claim.foundItem.postedBy,  // person who posted the found item = finder
        totalAmount,
        finderCut:   Math.round(totalAmount * 0.8),
        platformCut: Math.round(totalAmount * 0.2),
      });

    } else {
      // Rejected — unlock both items so they return to their feeds
      claim.status = 'rejected';
      await claim.save();

      await Promise.all([
        Item.findByIdAndUpdate(claim.foundItem._id, {
          status:        'unclaimed',
          matchedItemId:  null,
        }),
        Item.findByIdAndUpdate(claim.lostItem._id, {
          status:        'searching',
          matchedItemId:  null,
        }),
      ]);
    }

    res.status(200).json(claim);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStats, getAllItems, deleteItem, getAllUsers, updateUser, getPendingClaims, reviewClaim };
const Transaction = require('../models/Transaction');
const Item = require('../models/Item');

// -------------------------------------------------------
// @desc    Mock payment — simulates STK Push success,
//          generates OTP, locks both items for handoff
// @route   POST /api/payments/mock-pay
// @access  Private (Owner only)
// Body: { claimId }
// -------------------------------------------------------
const mockPay = async (req, res) => {
  try {
    const { claimId } = req.body;

    if (!claimId) {
      return res.status(400).json({ message: 'claimId is required' });
    }

    const transaction = await Transaction.findOne({ claimId });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    if (transaction.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the item owner can make this payment' });
    }
    if (transaction.status !== 'awaiting_payment') {
      return res.status(400).json({ message: 'Payment has already been processed' });
    }

    // Generate 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Update transaction
    transaction.stkStatus = 'success';
    transaction.otpCode   = otpCode;
    transaction.status    = 'escrowed';
    await transaction.save();

    // Lock both items for handoff — atomic parallel update
    await Promise.all([
      Item.findByIdAndUpdate(transaction.foundItemId, { status: 'ready_for_handoff' }),
      Item.findByIdAndUpdate(transaction.lostItemId,  { status: 'awaiting_handoff'  }),
    ]);

    res.status(200).json({ message: 'Payment successful. Handoff initiated.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------------------------------
// @desc    Verify OTP submitted by the Finder
// @route   POST /api/payments/verify-otp
// @access  Private (Finder only)
// Body: { claimId, otpCode }
// -------------------------------------------------------
const verifyOtp = async (req, res) => {
  try {
    const { claimId, otpCode } = req.body;

    if (!claimId || !otpCode) {
      return res.status(400).json({ message: 'claimId and otpCode are required' });
    }

    const transaction = await Transaction.findOne({ claimId });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    if (transaction.finderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the finder can verify the handshake code' });
    }
    if (transaction.status !== 'escrowed') {
      return res.status(400).json({ message: 'Payment has not been made yet' });
    }
    if (transaction.otpVerified) {
      return res.status(400).json({ message: 'Handshake code has already been used' });
    }

    // Wrong code — tell the finder without changing anything
    if (otpCode !== transaction.otpCode) {
      return res.status(400).json({ message: 'Incorrect code. Ask the owner to confirm.' });
    }

    // Correct code — release funds (mock B2C) and resolve both items
    transaction.otpVerified = true;
    transaction.b2cStatus   = 'success'; // mock — Stage 6 triggers real B2C here
    transaction.status      = 'released';
    await transaction.save();

    await Promise.all([
      Item.findByIdAndUpdate(transaction.foundItemId, { status: 'resolved' }),
      Item.findByIdAndUpdate(transaction.lostItemId,  { status: 'resolved' }),
    ]);

    res.status(200).json({ message: 'Handshake verified. Item resolved and payout sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------------------------------
// @desc    Get transaction for a claim — role-aware response.
//          Owner gets OTP + finder's phone.
//          Finder gets owner's phone but NO OTP.
// @route   GET /api/payments/transaction/:claimId
// @access  Private (Owner or Finder only)
// -------------------------------------------------------
const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ claimId: req.params.claimId })
      .populate('ownerId',  'name phone')
      .populate('finderId', 'name phone');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const userId     = req.user._id.toString();
    const isOwner    = transaction.ownerId._id.toString() === userId;
    const isFinder   = transaction.finderId._id.toString() === userId;

    if (!isOwner && !isFinder) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const data = transaction.toObject();

    if (isOwner) {
      // Owner sees OTP + finder's phone — never show owner's own phone back
      return res.status(200).json({
        status:      data.status,
        totalAmount: data.totalAmount,
        otpCode:     data.otpCode,       // shown large and bold in the UI
        otpVerified: data.otpVerified,
        finder: {
          name:  data.finderId.name,
          phone: data.finderId.phone,    // revealed after payment
        },
      });
    }

    // Finder sees owner's phone — OTP is deliberately stripped
    return res.status(200).json({
      status:      data.status,
      totalAmount: data.totalAmount,
      otpVerified: data.otpVerified,
      owner: {
        name:  data.ownerId.name,
        phone: data.ownerId.phone,       // revealed after payment
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------------------------------
// @desc    Get transaction by foundItemId — used by the Finder
//          who never has a claimId but always knows their foundItemId
// @route   GET /api/payments/transaction/by-item/:foundItemId
// @access  Private (Finder only)
// -------------------------------------------------------
const getTransactionByItem = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ foundItemId: req.params.foundItemId })
      .populate('ownerId',  'name phone')
      .populate('finderId', 'name phone');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const userId   = req.user._id.toString();
    const isFinder = transaction.finderId._id.toString() === userId;

    if (!isFinder) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const data = transaction.toObject();

    // Same as getTransaction Finder branch — OTP is never included
    return res.status(200).json({
      status:      data.status,
      totalAmount: data.totalAmount,
      otpVerified: data.otpVerified,
      claimId:     data.claimId,   // included so Finder can call verifyOtp
      owner: {
        name:  data.ownerId.name,
        phone: data.ownerId.phone,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { mockPay, verifyOtp, getTransaction, getTransactionByItem };
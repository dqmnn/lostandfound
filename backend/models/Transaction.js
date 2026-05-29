const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim',
      required: true,
    },
    foundItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    lostItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    finderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    totalAmount:  { type: Number, required: true },
    finderCut:    { type: Number, required: true }, // 80%
    platformCut:  { type: Number, required: true }, // 20%

    // STK Push — filled in Stage 6, stubbed in Stage 5
    stkCheckoutRequestId: { type: String, default: '' },
    stkStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },

    // OTP Handshake
    otpCode:     { type: String, default: '' },
    otpVerified: { type: Boolean, default: false },

    // B2C Payout — filled in Stage 6, stubbed in Stage 5
    b2cConversationId: { type: String, default: '' },
    b2cStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },

    status: {
      type: String,
      enum: ['awaiting_payment', 'escrowed', 'released', 'refunded', 'disputed'],
      default: 'awaiting_payment',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transaction', transactionSchema);
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: true,
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // --- Public fields (shown on Global Feed) ---
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ['Electronics', 'ID/Cards', 'Clothing', 'Books', 'Other'],
      required: true,
    },

    locationGeneral: {
      type: String,
      enum: [
        'Main Library',
        'Science Block',
        'Cafeteria',
        'Sports Complex',
        'Admin Block',
        'Lecture Hall',
        'Student Centre',
        'Parking Lot',
        'Other',
      ],
      required: true,
    },

    dateReported: {
      type: Date,
      default: Date.now,
    },

    photo: {
      type: String,
      default: '',
    },

    rewardAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --- Private fields (hidden from public, admin-only during review) ---
    locationExact: {
      type: String,
      trim: true,
      default: '',
    },

    privateDescription: {
      type: String,
      trim: true,
      default: '',
    },

    privatePhoto: {
      type: String,
      default: '',
    },

    // --- Status ---
    // Found items:  unclaimed → pending_review → awaiting_payment → ready_for_handoff → resolved | disputed
    // Lost items:   searching → claim_pending → claim_approved → awaiting_handoff → resolved
    status: {
      type: String,
      enum: [
        'unclaimed',
        'searching',
        'pending_review',
        'claim_pending',
        'awaiting_payment',
        'claim_approved',
        'ready_for_handoff',
        'awaiting_handoff',
        'resolved',
        'disputed',
      ],
      required: true,
    },

    matchedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Item', itemSchema);
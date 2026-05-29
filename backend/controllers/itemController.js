const Item = require('../models/Item');

// -------------------------------------------------------
// @desc    Report a lost item
// @route   POST /api/items/lost
// @access  Private
// -------------------------------------------------------
const reportLostItem = async (req, res) => {
  const {
    title,
    category,
    locationGeneral,
    photo,
    rewardAmount,
    locationExact,
    privateDescription,
    privatePhoto,
  } = req.body;

  // --- Validation ---
  if (!title || !category || !locationGeneral) {
    return res.status(400).json({ message: 'title, category, and locationGeneral are required' });
  }

  const item = await Item.create({
    type: 'lost',
    postedBy: req.user._id,
    title,
    category,
    locationGeneral,
    photo: photo || '',
    rewardAmount: rewardAmount || 0,
    locationExact: locationExact || '',
    privateDescription: privateDescription || '',
    privatePhoto: privatePhoto || '',
    status: 'searching',
  });

  res.status(201).json(item);
};

// -------------------------------------------------------
// @desc    Report a found item
// @route   POST /api/items/found
// @access  Private
// -------------------------------------------------------
const reportFoundItem = async (req, res) => {
  const {
    title,
    category,
    locationGeneral,
    photo,
    locationExact,
    privateDescription,
    privatePhoto,
  } = req.body;

  // --- Validation ---
  if (!title || !category || !locationGeneral) {
    return res.status(400).json({ message: 'title, category, and locationGeneral are required' });
  }

  const item = await Item.create({
    type: 'found',
    postedBy: req.user._id,
    title,
    category,
    locationGeneral,
    photo: photo || '',
    rewardAmount: 0,          // Found items never have a reward amount
    locationExact: locationExact || '',
    privateDescription: privateDescription || '',
    privatePhoto: privatePhoto || '',
    status: 'unclaimed',
  });

  res.status(201).json(item);
};

// -------------------------------------------------------
// @desc    Get all lost items (Global Feed) with optional filters
// @route   GET /api/items/lost
// @access  Public
// Query params: category, locationGeneral, dateFrom, dateTo
// -------------------------------------------------------
const getLostItems = async (req, res) => {
  const { category, locationGeneral, dateFrom, dateTo } = req.query;

  // Build filter object — only lost items on the public feed
  const filter = { type: 'lost' };

  if (category) {
    filter.category = category;
  }

  if (locationGeneral) {
    filter.locationGeneral = locationGeneral;
  }

  if (dateFrom || dateTo) {
    filter.dateReported = {};
    if (dateFrom) filter.dateReported.$gte = new Date(dateFrom);
    if (dateTo)   filter.dateReported.$lte = new Date(dateTo);
  }

  const items = await Item.find(filter)
    .select(
      'title category locationGeneral dateReported photo rewardAmount status createdAt'
    )
    .sort({ createdAt: -1 });

  res.json(items);
};

// -------------------------------------------------------
// @desc    Get all found items (Global Feed) with optional filters
// @route   GET /api/items/found
// @access  Public
// Query params: category, locationGeneral, dateFrom, dateTo
// Only returns items with status: "unclaimed" (others are locked in a claim flow)
// -------------------------------------------------------
const getFoundItems = async (req, res) => {
  const { category, locationGeneral, dateFrom, dateTo } = req.query;

  // Only unclaimed items are visible on the public feed
  const filter = { type: 'found', status: 'unclaimed' };

  if (category) {
    filter.category = category;
  }

  if (locationGeneral) {
    filter.locationGeneral = locationGeneral;
  }

  if (dateFrom || dateTo) {
    filter.dateReported = {};
    if (dateFrom) filter.dateReported.$gte = new Date(dateFrom);
    if (dateTo)   filter.dateReported.$lte = new Date(dateTo);
  }

  const items = await Item.find(filter)
    .select(
      'title category locationGeneral dateReported photo status createdAt'
    )
    .sort({ createdAt: -1 });

  res.json(items);
};

// @desc   Get all items posted by the logged-in user
// @route  GET /api/items/mine
// @access Private
const getMyItems = async (req, res) => {
  try {
    const filter = { postedBy: req.user._id };

    // Allow ?type=lost or ?type=found to filter per tab
    if (req.query.type === 'lost' || req.query.type === 'found') {
      filter.type = req.query.type;
    }

    const items = await Item.find(filter).sort({ createdAt: -1 });

    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  reportLostItem,
  reportFoundItem,
  getLostItems,
  getFoundItems,
  getMyItems
};
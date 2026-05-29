const User = require('../models/User');

// @desc    Get currently logged-in user's profile
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role,
  });
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// @desc    Promote a user to admin
// @route   PUT /api/users/promote/:id
// @access  Private/Admin
const promoteToAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    user.role = 'admin';
    await user.save();

    res.json({
      message: `${user.name} has been promoted to admin`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('promoteToAdmin error:', error);
    res.status(500).json({ message: 'Server error during promotion' });
  }
};

// @desc    Ban a user
// @route   PUT /api/users/ban/:id
// @access  Private/Admin
const banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban an admin account' });
    }

    if (user.isBanned) {
      return res.status(400).json({ message: 'User is already banned' });
    }

    user.isBanned = true;
    await user.save();

    res.json({ message: `${user.name} has been banned successfully` });
  } catch (error) {
    console.error('banUser error:', error);
    res.status(500).json({ message: 'Server error during ban' });
  }
};

// @desc    Unban a user
// @route   PUT /api/users/unban/:id
// @access  Private/Admin
const unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isBanned) {
      return res.status(400).json({ message: 'User is not currently banned' });
    }

    user.isBanned = false;
    await user.save();

    res.json({ message: `${user.name} has been unbanned successfully` });
  } catch (error) {
    console.error('unbanUser error:', error);
    res.status(500).json({ message: 'Server error during unban' });
  }
};

module.exports = { getMe, getAllUsers, promoteToAdmin, banUser, unbanUser };
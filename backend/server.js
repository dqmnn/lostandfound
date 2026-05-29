const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/claims', require('./routes/claimRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Smart Lost & Found API is running' });
});

// Global error handler for unhandled routes
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
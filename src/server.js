require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const passwordRoutes = require('./routes/passwordRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes (once implemented)
app.use('/api/auth', authRoutes);
app.use('/api/passwords', passwordRoutes);

// Root Endpoint
app.get('/', (req, res) => {
    res.send('Aegis Password Manager Backend');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
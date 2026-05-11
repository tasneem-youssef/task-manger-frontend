const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Database
initDB().catch(err => console.error('Database initialization failed:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Root route
app.get('/', (req, res) => {
    res.send("Task Manager API is running on Netlify Functions");
});

module.exports.handler = serverless(app);

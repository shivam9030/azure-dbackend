const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const chokidar = require('chokidar');  // <-- Added chokidar
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: 'https://frontend-azure-c4azd7fngvfadgdq.canadacentral-01.azurewebsites.net',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// MongoDB URI from environment or fallback (replace with your real URI)
const mongoURI = process.env.MONGO_URI ||process.env.AZURE_COSMOS_CONNECTIONSTRING;;

// Import Menu model
const MenuItem = require('./models/menu');

// Load dummy data if collection empty
async function loadDummyMenuIfEmpty() {
  try {
    const count = await MenuItem.countDocuments();
    if (count === 0) {
      console.log('No menu items found, loading dummy data...');
      const dataPath = path.join(__dirname, 'dummy.json');
      const jsonData = fs.readFileSync(dataPath, 'utf8');
      const menuItems = JSON.parse(jsonData);
      await MenuItem.insertMany(menuItems);
      console.log('✅ Dummy menu data loaded');
    } else {
      console.log('✅ Menu data exists, skipping load');
    }
  } catch (error) {
    console.error('❌ Error loading dummy menu data:', error);
  }
}

// Function to update menu from dummy-menu.json on file change
async function updateMenuFromFile() {
  try {
    console.log('Detected dummy-menu.json change, updating database...');
    const dataPath = path.join(__dirname, 'dummy.json');
    const jsonData = fs.readFileSync(dataPath, 'utf8');
    const menuItems = JSON.parse(jsonData);

    await MenuItem.deleteMany({});
    await MenuItem.insertMany(menuItems);

    console.log('✅ Menu data updated from dummy-menu.json');
  } catch (error) {
    console.error('❌ Error updating menu from file:', error);
  }
}

async function startServer() {
  try {
    // Connect to MongoDB without deprecated options
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Load dummy menu data if empty
    await loadDummyMenuIfEmpty();

    // Simple JSON API endpoint to get all menu items
    app.get('/menu', async (req, res) => {
      try {
        const menu = await MenuItem.find();
        if (!menu || menu.length === 0) {
          return res.status(404).json({ error: 'No menu items found' });
        }
        res.json(menu);
      } catch (err) {
        console.error('Error fetching menu:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
}

// Start the server, then watch the dummy-menu.json file for changes
startServer().then(() => {
  const dataPath = path.join(__dirname, 'dummy.json');
  const watcher = chokidar.watch(dataPath, { ignoreInitial: true });

  watcher.on('change', () => {
    updateMenuFromFile();
  });

  console.log('👀 Watching dummy-menu.json for changes...');
});

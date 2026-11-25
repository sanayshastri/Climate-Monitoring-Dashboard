import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import FormSubmission from './FormSubmission.js';
import {
  getCatalogFromDB,
  fetchLiveWeatherData,
  searchGeocodingCities
} from './weatherApi.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/climate_guard';

// Middleware
app.use(cors());
app.use(express.json());

// 1. Connect to MongoDB (climate_guard database)
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    await FormSubmission.createCollection();
    console.log('Connected to MongoDB (climate_guard database ready)');
  })
  .catch((err) => console.error('MongoDB connection error:', err.message));

// 2. Weather API Routes (all reference & station data fetched from MongoDB)

// Get IMD stations, regions, and current season from MongoDB
app.get('/api/weather/catalog', async (req, res) => {
  try {
    const catalog = await getCatalogFromDB();
    res.json(catalog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch live weather, evaluate against MongoDB rules, and update station in MongoDB
app.post('/api/weather/live', async (req, res) => {
  const { lat, lon, name, eyebrow, stationMeta } = req.body;
  const data = await fetchLiveWeatherData(lat, lon, name, eyebrow, stationMeta);
  if (!data) {
    return res.status(500).json({ error: 'Failed to fetch live weather data' });
  }
  res.json(data);
});

// Search Indian cities and resolve IMD regions from MongoDB
app.get('/api/weather/search', async (req, res) => {
  const results = await searchGeocodingCities(req.query.q || '');
  res.json(results);
});

// 3. MongoDB Form Submission Routes (for userform.jsx)

// Save a new form submission to MongoDB
app.post('/api/submissions', async (req, res) => {
  try {
    const body = {
      ...req.body,
      triggerHeatAlert: req.body.triggerHeatAlert !== '' ? Number(req.body.triggerHeatAlert) : null,
      triggerAqiAlert: req.body.triggerAqiAlert !== '' ? Number(req.body.triggerAqiAlert) : null
    };
    const savedSubmission = await FormSubmission.create(body);
    res.status(201).json({
      message: 'Form submission saved to MongoDB',
      submission: savedSubmission
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all form submissions from MongoDB
app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await FormSubmission.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

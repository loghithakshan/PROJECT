const mongoose = require('mongoose');

const hazardSchema = new mongoose.Schema({
  hazardId: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['weather', 'seismic', 'flood', 'air_quality', 'wildfire', 'tsunami', 'tornado'],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  severity: {
    type: Number,
    min: 0,
    max: 100
  },
  description: String,
  detectedAt: Date,
  predictedDuration: String,
  affectedArea: {
    radius: Number,
    coordinates: [Number]
  },
  source: {
    type: String,
    enum: ['usgs', 'noaa', 'nws', 'airnow', 'firms', 'custom'],
    required: true
  },
  sourceData: mongoose.Schema.Types.Mixed,
  weatherData: {
    temperature: Number,
    humidity: Number,
    windSpeed: Number,
    precipitation: Number,
    visibility: Number
  },
  seismicData: {
    magnitude: Number,
    depth: Number,
    epicenter: [Number],
    p_wave: String,
    s_wave: String
  },
  floodData: {
    waterLevel: Number,
    riskLevel: String,
    riverName: String,
    gauge: String
  },
  airQualityData: {
    aqi: Number,
    pm25: Number,
    pm10: Number,
    o3: Number,
    no2: Number,
    so2: Number
  },
  alertGenerated: Boolean,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

hazardSchema.index({ location: '2dsphere' });
hazardSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Hazard', hazardSchema);

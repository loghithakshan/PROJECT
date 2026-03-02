const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['earthquake', 'flood', 'weather', 'wildfire', 'sos', 'custom'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: String,
  description: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  radius: {
    type: Number, // in km
    default: 50
  },
  affectedArea: String,
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'archived'],
    default: 'active'
  },
  multilingualContent: {
    es: String,
    fr: String,
    de: String,
    zh: String,
    ar: String,
    hi: String
  },
  affectedResponders: [String],
  respondersEngaged: [String],
  metadata: {
    source: String,
    externalId: String,
    confidence: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date
});

alertSchema.index({ location: '2dsphere' });
alertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

module.exports = mongoose.model('Alert', alertSchema);

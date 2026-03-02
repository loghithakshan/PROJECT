const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const AlertController = require('../controllers/AlertController');

const alertController = new AlertController();

/**
 * POST /alerts
 * Create new emergency alert
 */
router.post('/', authenticate, (req, res) => {
  alertController.createAlert(req, res);
});

/**
 * GET /alerts
 * Get all active alerts in region
 */
router.get('/', authenticate, (req, res) => {
  alertController.getAlerts(req, res);
});

/**
 * GET /alerts/:alertId
 * Get alert by ID
 */
router.get('/:alertId', authenticate, (req, res) => {
  alertController.getAlertById(req, res);
});

/**
 * PATCH /alerts/:alertId/status
 * Update alert status
 */
router.patch('/:alertId/status', authenticate, (req, res) => {
  alertController.updateAlertStatus(req, res);
});

/**
 * POST /alerts/subscribe
 * Subscribe to alerts in region (WebSocket)
 */
router.post('/subscribe', authenticate, (req, res) => {
  alertController.subscribeToAlerts(req, res);
});

module.exports = router;

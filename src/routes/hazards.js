const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const HazardController = require('../controllers/HazardController');

const hazardController = new HazardController();

/**
 * POST /hazards/detect
 * Detect environmental hazards at location
 */
router.post('/detect', authenticate, (req, res) => {
  hazardController.detectHazard(req, res);
});

/**
 * GET /hazards/nearby
 * Get hazards within geographic region
 */
router.get('/nearby', authenticate, (req, res) => {
  hazardController.getHazardsByLocation(req, res);
});

/**
 * POST /hazards/report
 * User-reported hazard (community reporting)
 */
router.post('/report', authenticate, (req, res) => {
  hazardController.reportHazard(req, res);
});

/**
 * POST /hazards/:hazardId/verify
 * Verify/upvote a hazard report
 */
router.post('/:hazardId/verify', authenticate, (req, res) => {
  hazardController.verifyHazard(req, res);
});

/**
 * GET /hazards/stats
 * Get hazard statistics
 */
router.get('/stats', (req, res) => {
  hazardController.getHazardStats(req, res);
});

module.exports = router;

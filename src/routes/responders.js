const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ResponderController = require('../controllers/ResponderController');

const responderController = new ResponderController();

/**
 * POST /responders/register
 * Register new responder profile
 */
router.post('/register', authenticate, (req, res) => {
  responderController.registerResponder(req, res);
});

/**
 * GET /responders/nearby
 * Find available responders near location
 */
router.get('/nearby', authenticate, (req, res) => {
  responderController.getAvailableResponders(req, res);
});

/**
 * GET /responders/:responderId
 * Get responder profile and details
 */
router.get('/:responderId', authenticate, (req, res) => {
  responderController.getResponderProfile(req, res);
});

/**
 * PATCH /responders/:responderId/status
 * Update responder status and location
 */
router.patch('/:responderId/status', authenticate, (req, res) => {
  responderController.updateResponderStatus(req, res);
});

/**
 * POST /responders/assign
 * Assign responder to alert
 */
router.post('/assign', authenticate, (req, res) => {
  responderController.assignResponderToAlert(req, res);
});

module.exports = router;

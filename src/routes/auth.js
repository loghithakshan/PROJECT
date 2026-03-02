const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const AuthController = require('../controllers/AuthController');
const logger = require('../utils/logger');

// Register endpoint
router.post('/register', async (req, res) => {
  logger.info('Register endpoint called');
  return AuthController.register(req, res);
});

// Login endpoint
router.post('/login', async (req, res) => {
  logger.info('Login endpoint called');
  return AuthController.login(req, res);
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  logger.info('Token refresh endpoint called');
  return AuthController.refreshToken(req, res);
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  logger.info('Get current user endpoint called');
  return AuthController.getCurrentUser(req, res);
});

// Update profile
router.patch('/profile', authenticate, async (req, res) => {
  logger.info('Update profile endpoint called');
  return AuthController.updateProfile(req, res);
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  logger.info('Change password endpoint called');
  return AuthController.changePassword(req, res);
});

// Check permission
router.post('/check-permission', authenticate, async (req, res) => {
  logger.info('Check permission endpoint called');
  return AuthController.checkPermission(req, res);
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  logger.info('Logout endpoint called');
  return AuthController.logout(req, res);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const MessagingController = require('../controllers/MessagingController');

const messagingController = new MessagingController();

/**
 * POST /messages
 * Send encrypted message
 */
router.post('/', authenticate, (req, res) => {
  messagingController.sendMessage(req, res);
});

/**
 * GET /messages/conversation/:participantId
 * Get messages in conversation with pagination
 */
router.get('/conversation/:participantId', authenticate, (req, res) => {
  messagingController.getMessages(req, res);
});

/**
 * GET /messages/conversation/:participantId/metadata
 * Get conversation metadata
 */
router.get('/conversation/:participantId/metadata', authenticate, (req, res) => {
  messagingController.getConversation(req, res);
});

/**
 * PATCH /messages/:messageId/read
 * Mark message as read
 */
router.patch('/:messageId/read', authenticate, (req, res) => {
  messagingController.markAsRead(req, res);
});

/**
 * POST /messages/:messageId/reaction
 * Add reaction to message
 */
router.post('/:messageId/reaction', authenticate, (req, res) => {
  messagingController.addReaction(req, res);
});

/**
 * GET /messages/search
 * Search messages
 */
router.get('/search', authenticate, (req, res) => {
  messagingController.searchMessages(req, res);
});

/**
 * DELETE /messages/:messageId
 * Delete message (soft delete)
 */
router.delete('/:messageId', authenticate, (req, res) => {
  messagingController.deleteMessage(req, res);
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const TranslationController = require('../controllers/TranslationController');

const translationController = new TranslationController();

/**
 * POST /translate
 * Translate text with advanced caching and circuit breaker
 */
router.post('/', authenticate, (req, res) => {
  translationController.translate(req, res);
});

/**
 * POST /translate/bulk
 * Bulk translate multiple items
 */
router.post('/bulk', authenticate, (req, res) => {
  translationController.bulkTranslate(req, res);
});

/**
 * POST /translate/detect
 * Detect language of input text
 */
router.post('/detect', authenticate, (req, res) => {
  translationController.detectLanguage(req, res);
});

/**
 * GET /translate/languages
 * Get all supported languages
 */
router.get('/languages', (req, res) => {
  translationController.getSupportedLanguages(req, res);
});

/**
 * GET /translate/metrics
 * Get translation metrics and statistics
 */
router.get('/metrics', authenticate, (req, res) => {
  translationController.getMetrics(req, res);
});

module.exports = router;

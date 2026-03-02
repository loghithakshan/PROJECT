const logger = require('../utils/logger');
const ValidationEngine = require('../utils/ValidationEngine');
const ResponseFormatter = require('../utils/RequestHandler').ResponseFormatter;
const CacheManager = require('../utils/CacheManager');
const CircuitBreaker = require('../utils/CircuitBreaker');
const RequestHandler = require('../utils/RequestHandler');

/**
 * TranslationController - Advanced multilingual translation management
 * Integrates: ValidationEngine, CacheManager, CircuitBreaker, RequestHandler
 */
class TranslationController {
  constructor(cacheManager = null, circuitBreaker = null) {
    this.cache = cacheManager || new CacheManager(500, 3600000); // 1 hour TTL
    this.circuitBreaker = circuitBreaker || new CircuitBreaker({
      name: 'TranslationAPI',
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000
    });

    // Supported languages with metadata
    this.supportedLanguages = {
      'en': { name: 'English', nativeName: 'English', rtl: false },
      'es': { name: 'Spanish', nativeName: 'Español', rtl: false },
      'fr': { name: 'French', nativeName: 'Français', rtl: false },
      'de': { name: 'German', nativeName: 'Deutsch', rtl: false },
      'ar': { name: 'Arabic', nativeName: 'العربية', rtl: true },
      'zh': { name: 'Chinese', nativeName: '中文', rtl: false },
      'ja': { name: 'Japanese', nativeName: '日本語', rtl: false },
      'pt': { name: 'Portuguese', nativeName: 'Português', rtl: false },
      'ru': { name: 'Russian', nativeName: 'Русский', rtl: false },
      'hi': { name: 'Hindi', nativeName: 'हिन्दी', rtl: false }
    };

    this.metrics = {
      translationsRequested: 0,
      cacheHits: 0,
      translationsFailed: 0
    };
  }

  /**
   * Translate text with caching and circuit breaker protection
   */
  async translate(req, res) {
    const startTime = Date.now();
    
    try {
      const { text, sourceLanguage = 'auto', targetLanguage } = req.body;

      // Validation
      const validation = ValidationEngine.validateObject({
        text: { type: 'string', required: true, minLength: 1, maxLength: 5000 },
        targetLanguage: { type: 'string', required: true, pattern: /^[a-z]{2}$/ }
      }, { text, targetLanguage });

      if (!validation.valid) {
        logger.warn('Translation validation failed', { errors: validation.errors });
        return ResponseFormatter.error({ 
          message: 'Invalid translation request',
          details: validation.errors 
        }, 400);
      }

      // Check target language support
      if (!this.supportedLanguages[targetLanguage]) {
        return ResponseFormatter.error({ 
          message: 'Target language not supported',
          supported: Object.keys(this.supportedLanguages)
        }, 400);
      }

      // Cache key - include source language if specified
      const cacheKey = `translation:${sourceLanguage}:${targetLanguage}:${text.substring(0, 50).replace(/\s+/g, '_')}`;
      
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        logger.info('Translation cache hit', { cacheKey });
        return ResponseFormatter.success(
          { ...cached, cached: true },
          'Translation retrieved from cache',
          200
        );
      }

      this.metrics.translationsRequested++;

      // Use circuit breaker for external API call
      const result = await this.circuitBreaker.execute(async () => {
        return await this._callTranslationAPI(text, sourceLanguage, targetLanguage);
      });

      if (!result) {
        this.metrics.translationsFailed++;
        return ResponseFormatter.error({ 
          message: 'Translation service temporarily unavailable'
        }, 503);
      }

      // Cache the result
      this.cache.set(cacheKey, result, 3600000); // 1 hour TTL

      logger.info('Translation completed', { 
        length: text.length,
        from: sourceLanguage,
        to: targetLanguage,
        duration: Date.now() - startTime
      });

      return ResponseFormatter.success(
        { ...result, cached: false },
        'Text translated successfully',
        200
      );

    } catch (error) {
      logger.error('Translation error', { error: error.message, stack: error.stack });
      this.metrics.translationsFailed++;
      return ResponseFormatter.error({ message: 'Translation failed' }, 500);
    }
  }

  /**
   * Detect language of input text
   */
  async detectLanguage(req, res) {
    try {
      const { text } = req.body;

      const validation = ValidationEngine.validateObject({
        text: { type: 'string', required: true, minLength: 1, maxLength: 5000 }
      }, { text });

      if (!validation.valid) {
        return ResponseFormatter.error({ 
          message: 'Invalid request',
          details: validation.errors 
        }, 400);
      }

      const cacheKey = `language:detect:${text.substring(0, 50).replace(/\s+/g, '_')}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return ResponseFormatter.success(cached, 'Language detected (cached)', 200);
      }

      // Simple language detection based on character patterns
      const detected = this._detectLanguagePattern(text);

      this.cache.set(cacheKey, detected, 3600000);

      logger.info('Language detected', { language: detected.language, confidence: detected.confidence });

      return ResponseFormatter.success(detected, 'Language detected successfully', 200);

    } catch (error) {
      logger.error('Language detection error', { error: error.message });
      return ResponseFormatter.error({ message: 'Detection failed' }, 500);
    }
  }

  /**
   * Get all supported languages
   */
  async getSupportedLanguages(req, res) {
    try {
      const cacheKey = 'languages:supported';
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        return ResponseFormatter.success(cached, 'Supported languages (cached)', 200);
      }

      const languages = Object.entries(this.supportedLanguages).map(([code, info]) => ({
        code,
        ...info
      }));

      this.cache.set(cacheKey, languages, 3600000);

      return ResponseFormatter.success(
        languages,
        `${languages.length} languages supported`,
        200
      );

    } catch (error) {
      logger.error('Get languages error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to retrieve languages' }, 500);
    }
  }

  /**
   * Bulk translate multiple items
   */
  async bulkTranslate(req, res) {
    try {
      const { items, targetLanguage } = req.body;

      const validation = ValidationEngine.validateObject({
        items: { type: 'array', required: true, minLength: 1, maxLength: 100 },
        targetLanguage: { type: 'string', required: true, pattern: /^[a-z]{2}$/ }
      }, { items: items || [], targetLanguage });

      if (!validation.valid) {
        return ResponseFormatter.error({ 
          message: 'Invalid bulk translation request',
          details: validation.errors 
        }, 400);
      }

      // Validate each item
      const results = [];
      const failed = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (!item.text || typeof item.text !== 'string') {
          failed.push({ index: i, reason: 'Invalid text field' });
          continue;
        }

        const cacheKey = `translation:auto:${targetLanguage}:${item.text.substring(0, 50).replace(/\s+/g, '_')}`;
        const cached = this.cache.get(cacheKey);

        if (cached) {
          results.push({
            index: i,
            original: item.text,
            translated: cached.translatedText,
            cached: true
          });
        } else {
          try {
            const result = await this.circuitBreaker.execute(async () => {
              return await this._callTranslationAPI(item.text, 'auto', targetLanguage);
            });

            if (result) {
              this.cache.set(cacheKey, result, 3600000);
              results.push({
                index: i,
                original: item.text,
                translated: result.translatedText,
                cached: false
              });
            } else {
              failed.push({ index: i, reason: 'Translation service unavailable' });
            }
          } catch (error) {
            failed.push({ index: i, reason: error.message });
          }
        }
      }

      logger.info('Bulk translation completed', {
        total: items.length,
        successful: results.length,
        failed: failed.length
      });

      return ResponseFormatter.success(
        { translations: results, failed },
        `Translated ${results.length}/${items.length} items`,
        results.length > 0 ? 200 : 206
      );

    } catch (error) {
      logger.error('Bulk translation error', { error: error.message });
      return ResponseFormatter.error({ message: 'Bulk translation failed' }, 500);
    }
  }

  /**
   * Get translation metrics and statistics
   */
  async getMetrics(req, res) {
    try {
      const stats = {
        ...this.metrics,
        cacheStats: this.cache.getStats(),
        circuitBreakerStatus: this.circuitBreaker.getStatus()
      };

      return ResponseFormatter.success(stats, 'Translation metrics retrieved', 200);

    } catch (error) {
      logger.error('Get metrics error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to retrieve metrics' }, 500);
    }
  }

  /**
   * Internal: Call translation API with circuit breaker
   */
  async _callTranslationAPI(text, sourceLanguage, targetLanguage) {
    // Simulated API call - in production, would call external translation service
    // (Google Translate, AWS Translate, custom AI service, etc.)
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock translation
        resolve({
          originalText: text,
          translatedText: `[${targetLanguage}] ${text}`,
          sourceLanguage: sourceLanguage === 'auto' ? 'en' : sourceLanguage,
          targetLanguage: targetLanguage,
          confidence: 0.95,
          timestamp: new Date()
        });
      }, 100);
    });
  }

  /**
   * Internal: Simple language detection based on character patterns
   */
  _detectLanguagePattern(text) {
    // Simplified language detection based on script patterns
    const arabicRegex = /[\u0600-\u06FF]/g;
    const chineseRegex = /[\u4E00-\u9FFF]/g;
    const cyrillicRegex = /[\u0400-\u04FF]/g;
    const devanagariRegex = /[\u0900-\u097F]/g;
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/g;

    const arabicMatches = (text.match(arabicRegex) || []).length;
    const chineseMatches = (text.match(chineseRegex) || []).length;
    const cyrillicMatches = (text.match(cyrillicRegex) || []).length;
    const devanagariMatches = (text.match(devanagariRegex) || []).length;
    const japaneseMatches = (text.match(japaneseRegex) || []).length;

    if (arabicMatches > text.length * 0.5) {
      return { language: 'ar', confidence: 0.95, method: 'script_analysis' };
    }
    if (chineseMatches > text.length * 0.5) {
      return { language: 'zh', confidence: 0.95, method: 'script_analysis' };
    }
    if (cyrillicMatches > text.length * 0.5) {
      return { language: 'ru', confidence: 0.95, method: 'script_analysis' };
    }
    if (devanagariMatches > text.length * 0.5) {
      return { language: 'hi', confidence: 0.95, method: 'script_analysis' };
    }
    if (japaneseMatches > text.length * 0.3) {
      return { language: 'ja', confidence: 0.95, method: 'script_analysis' };
    }

    // Default to English for Latin script
    return { language: 'en', confidence: 0.7, method: 'default' };
  }
}

module.exports = TranslationController;

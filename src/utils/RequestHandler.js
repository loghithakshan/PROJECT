/**
 * Advanced Request Handler Framework
 * Unified request/response handling with validation and transformation
 */

const logger = require('./logger');

class RequestHandler {
  constructor() {
    this.preprocessors = [];
    this.postprocessors = [];
  }

  /**
   * Create advanced endpoint handler
   */
  createHandler(options = {}) {
    return async (req, res) => {
      const startTime = Date.now();
      const requestId = req.id;

      try {
        // Preprocess
        for (const preprocessor of this.preprocessors) {
          await preprocessor(req, res);
        }

        // Validate
        if (options.validate && options.validationSchema) {
          const validationEngine = req.app.get('validationEngine');
          if (validationEngine) {
            const result = validationEngine.validateObject(
              req.body || {},
              options.validationSchema
            );

            if (!result.valid) {
              return res.status(400).json({
                error: 'Validation failed',
                errors: result.errors,
                requestId
              });
            }

            req.validatedBody = result.data;
          }
        }

        // Rate limit check
        if (options.rateLimit) {
          const RateLimiter = require('./RateLimiter');
          const key = req.user?.userId || req.ip;
          const result = RateLimiter.isLimited(
            key,
            options.rateLimit.strategy || 'slidingWindow',
            options.rateLimit.limit || 100,
            options.rateLimit.window || 60000
          );

          if (!result.allowed) {
            return res.status(429).json({
              error: 'Rate limit exceeded',
              retryAfter: result.resetIn,
              requestId
            });
          }
        }

        // Check cache if enabled
        if (options.cache) {
          const cache = req.app.get('cache');
          const cacheKey = options.cacheKey ? options.cacheKey(req) : null;

          if (cacheKey) {
            const cached = cache.get(cacheKey);
            if (cached) {
              logger.debug(`Cache hit for ${cacheKey}`);
              return res.json({
                ...cached,
                cached: true,
                requestId
              });
            }
          }
        }

        // Execute handler
        const result = await options.handler(req, res);

        // Cache result if enabled
        if (options.cache && options.cacheKey && result) {
          const cache = req.app.get('cache');
          const cacheKey = options.cacheKey(req);
          const cacheTTL = options.cacheTTL || 3600000;
          cache.set(cacheKey, result, cacheTTL);
        }

        // Postprocess
        for (const postprocessor of this.postprocessors) {
          await postprocessor(req, res, result);
        }

        const duration = Date.now() - startTime;
        logger.debug(`[${requestId}] Handler completed in ${duration}ms`);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`[${requestId}] Handler error after ${duration}ms:`, error);

        res.status(error.statusCode || 500).json({
          error: error.message,
          requestId,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Register preprocessor
   */
  addPreprocessor(fn) {
    this.preprocessors.push(fn);
  }

  /**
   * Register postprocessor
   */
  addPostprocessor(fn) {
    this.postprocessors.push(fn);
  }
}

/**
 * Advanced response formatter
 */
class ResponseFormatter {
  static success(data, message = 'Success', statusCode = 200) {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(error, statusCode = 500) {
    return {
      success: false,
      error: typeof error === 'string' ? error : error.message,
      statusCode,
      timestamp: new Date().toISOString()
    };
  }

  static paginated(data, page, limit, total) {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  RequestHandler,
  ResponseFormatter,
  createHandler: (options) => new RequestHandler().createHandler(options)
};

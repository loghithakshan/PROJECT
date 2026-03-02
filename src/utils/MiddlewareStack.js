/**
 * Advanced Middleware Stack System
 * Composable middleware with execution context
 */

class MiddlewareStack {
  constructor() {
    this.middlewares = [];
    this.errorHandlers = [];
  }

  /**
   * Add middleware to stack
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new Error('Middleware must be a function');
    }
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Add error handling middleware
   */
  useError(errorHandler) {
    this.errorHandlers.push(errorHandler);
    return this;
  }

  /**
   * Execute middleware stack
   */
  async execute(context) {
    const stack = [...this.middlewares];
    let index = 0;

    const next = async () => {
      if (index >= stack.length) {
        return;
      }

      const middleware = stack[index++];
      try {
        await middleware(context, next);
      } catch (error) {
        context.error = error;
        await this._handleError(context, error);
      }
    };

    try {
      await next();
    } catch (error) {
      context.error = error;
      await this._handleError(context, error);
    }

    return context;
  }

  /**
   * Handle errors through error handlers
   */
  async _handleError(context, error) {
    for (const handler of this.errorHandlers) {
      try {
        await handler(context, error);
        break; // Stop after first handler
      } catch (err) {
        // Continue to next error handler
      }
    }
  }

  /**
   * Create named middleware group
   */
  group(name, middlewares) {
    return {
      name,
      middlewares: Array.isArray(middlewares) ? middlewares : [middlewares],
      execute: async (context) => {
        let index = 0;
        const next = async () => {
          if (index >= this.middlewares.length) return;
          const middleware = this.middlewares[index++];
          await middleware(context, next);
        };
        await next();
      }
    };
  }

  /**
   * Clear all middleware
   */
  clear() {
    this.middlewares = [];
    this.errorHandlers = [];
  }

  /**
   * Get middleware count
   */
  size() {
    return this.middlewares.length;
  }
}

/**
 * Create advanced authentication middleware
 */
function createAuthMiddleware(authSystem) {
  return async (context, next) => {
    const token = context.headers?.authorization?.split(' ')[1];

    if (!token) {
      throw new Error('No authentication token provided');
    }

    try {
      context.user = authSystem.verifyToken(token);
      context.token = token;
      await next();
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  };
}

/**
 * Create rate limiting middleware
 */
function createRateLimitMiddleware(rateLimiter, limit = 100, windowMs = 15 * 60 * 1000) {
  return async (context, next) => {
    const key = context.user?.userId || context.ip;
    const result = rateLimiter.isLimited(key, 'slidingWindow', limit, windowMs);

    context.rateLimit = {
      limit,
      remaining: result.remaining,
      resetIn: result.resetIn
    };

    if (!result.allowed) {
      context.response = {
        status: 429,
        body: { error: 'Too many requests' }
      };
      return;
    }

    await next();
  };
}

/**
 * Create validation middleware
 */
function createValidationMiddleware(validationEngine, schema) {
  return async (context, next) => {
    const result = validationEngine.validateObject(context.body || {}, schema);

    if (!result.valid) {
      context.response = {
        status: 400,
        body: { error: 'Validation failed', errors: result.errors }
      };
      return;
    }

    context.validatedBody = result.data;
    await next();
  };
}

/**
 * Create logging middleware
 */
function createLoggingMiddleware(logger) {
  return async (context, next) => {
    const startTime = Date.now();
    const requestId = context.requestId || `req-${Date.now()}`;

    context.requestId = requestId;
    logger.info(`[${requestId}] ${context.method} ${context.path}`, {
      ip: context.ip,
      userId: context.user?.userId
    });

    await next();

    const duration = Date.now() - startTime;
    logger.info(`[${requestId}] Response ${context.response?.status || 200} - ${duration}ms`);
  };
}

module.exports = {
  MiddlewareStack,
  createAuthMiddleware,
  createRateLimitMiddleware,
  createValidationMiddleware,
  createLoggingMiddleware
};

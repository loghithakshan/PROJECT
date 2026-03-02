/**
 * Advanced Request/Response Interceptor System
 * Request validation, transformation, response formatting
 */

class RequestInterceptor {
  constructor() {
    this.interceptors = {
      request: [],
      response: [],
      error: []
    };
    this.requestMetrics = new Map();
  }

  /**
   * Register request interceptor
   */
  registerRequestInterceptor(handler) {
    this.interceptors.request.push(handler);
    return () => {
      const index = this.interceptors.request.indexOf(handler);
      if (index > -1) this.interceptors.request.splice(index, 1);
    };
  }

  /**
   * Register response interceptor
   */
  registerResponseInterceptor(handler) {
    this.interceptors.response.push(handler);
    return () => {
      const index = this.interceptors.response.indexOf(handler);
      if (index > -1) this.interceptors.response.splice(index, 1);
    };
  }

  /**
   * Register error interceptor
   */
  registerErrorInterceptor(handler) {
    this.interceptors.error.push(handler);
    return () => {
      const index = this.interceptors.error.indexOf(handler);
      if (index > -1) this.interceptors.error.splice(index, 1);
    };
  }

  /**
   * Process request through interceptors
   */
  async processRequest(req) {
    let request = { ...req };
    
    for (const interceptor of this.interceptors.request) {
      request = await interceptor(request);
    }

    return request;
  }

  /**
   * Process response through interceptors
   */
  async processResponse(res) {
    let response = { ...res };
    
    for (const interceptor of this.interceptors.response) {
      response = await interceptor(response);
    }

    return response;
  }

  /**
   * Process error through interceptors
   */
  async processError(error) {
    let err = { ...error };
    
    for (const interceptor of this.interceptors.error) {
      err = await interceptor(err);
    }

    return err;
  }

  /**
   * Track request metrics
   */
  trackRequest(requestId, metrics) {
    this.requestMetrics.set(requestId, {
      ...metrics,
      timestamp: Date.now()
    });

    // Cleanup old metrics
    if (this.requestMetrics.size > 10000) {
      const entries = Array.from(this.requestMetrics.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 5000);
      
      this.requestMetrics.clear();
      entries.forEach(([key, value]) => this.requestMetrics.set(key, value));
    }
  }

  /**
   * Get metrics for debugging
   */
  getMetrics() {
    const metrics = Array.from(this.requestMetrics.values());
    return {
      totalRequests: metrics.length,
      avgResponseTime: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length || 0,
      maxResponseTime: Math.max(...metrics.map(m => m.duration || 0)),
      errorCount: metrics.filter(m => m.error).length
    };
  }
}

module.exports = new RequestInterceptor();

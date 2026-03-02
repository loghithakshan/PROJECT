const logger = require('../utils/logger');
const ValidationEngine = require('../utils/ValidationEngine');
const ResponseFormatter = require('../utils/RequestHandler').ResponseFormatter;
const CacheManager = require('../utils/CacheManager');
const CircuitBreaker = require('../utils/CircuitBreaker');
const EventPublisher = require('../utils/EventPublisher');

/**
 * HazardController - Advanced environmental hazard detection and management
 * Integrates: ValidationEngine, CacheManager, CircuitBreaker, EventPublisher
 */
class HazardController {
  constructor(cacheManager = null, circuitBreaker = null, eventPublisher = null) {
    this.cache = cacheManager || new CacheManager(1000, 300000); // 5 min TTL for hazard data
    this.circuitBreaker = circuitBreaker || new CircuitBreaker({
      name: 'HazardDetectionAPI',
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000
    });
    this.eventPublisher = eventPublisher || new EventPublisher();

    // Hazard types with severity levels
    this.hazardTypes = {
      'seismic': { name: 'Seismic Activity', icon: '🌍', maxSeverity: 10 },
      'weather': { name: 'Weather Alert', icon: '⛈️', maxSeverity: 5 },
      'flood': { name: 'Flood Warning', icon: '🌊', maxSeverity: 4 },
      'air_quality': { name: 'Air Quality', icon: '💨', maxSeverity: 6 },
      'wildfire': { name: 'Wildfire', icon: '🔥', maxSeverity: 5 },
      'tsunami': { name: 'Tsunami', icon: '🌊', maxSeverity: 3 },
      'tornado': { name: 'Tornado', icon: '🌪️', maxSeverity: 5 },
      'volcano': { name: 'Volcanic Activity', icon: '🌋', maxSeverity: 8 }
    };

    this.metrics = {
      hazardsDetected: 0,
      hazardsReported: 0,
      cacheHits: 0,
      apiErrors: 0
    };
  }

  /**
   * Detect hazards at specified location
   */
  async detectHazard(req, res) {
    const startTime = Date.now();

    try {
      const { latitude, longitude, radius = 50 } = req.body;

      // Validation
      const validation = ValidationEngine.validateObject({
        latitude: { type: 'number', required: true, min: -90, max: 90 },
        longitude: { type: 'number', required: true, min: -180, max: 180 },
        radius: { type: 'number', required: false, min: 1, max: 500 }
      }, { latitude, longitude, radius });

      if (!validation.valid) {
        logger.warn('Hazard detection validation failed', { errors: validation.errors });
        return ResponseFormatter.error({
          message: 'Invalid hazard detection request',
          details: validation.errors
        }, 400);
      }

      // Check cache first
      const cacheKey = `hazard:${latitude.toFixed(2)}:${longitude.toFixed(2)}:${radius}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        this.metrics.cacheHits++;
        logger.info('Hazard cache hit', { cacheKey });
        return ResponseFormatter.success(
          { ...cached, cached: true },
          'Hazards retrieved from cache',
          200
        );
      }

      this.metrics.hazardsDetected++;

      // Use circuit breaker for external API calls
      const hazards = await this.circuitBreaker.execute(async () => {
        return await this._queryHazardAPIs(latitude, longitude, radius);
      });

      if (!hazards) {
        this.metrics.apiErrors++;
        return ResponseFormatter.error({
          message: 'Hazard detection service temporarily unavailable'
        }, 503);
      }

      // Cache results
      this.cache.set(cacheKey, hazards, 300000); // 5 minute TTL

      // Publish high-severity hazard events
      for (const hazard of hazards.activeHazards) {
        if (hazard.severity >= 7) {
          this.eventPublisher.publish('hazard:detected', {
            type: hazard.type,
            location: { latitude, longitude },
            severity: hazard.severity,
            timestamp: new Date()
          });
        }
      }

      logger.info('Hazard detection completed', {
        location: `${latitude},${longitude}`,
        radius,
        hazardCount: hazards.activeHazards.length,
        duration: Date.now() - startTime
      });

      return ResponseFormatter.success(hazards, 'Hazards detected', 200);

    } catch (error) {
      logger.error('Hazard detection error', { error: error.message });
      this.metrics.apiErrors++;
      return ResponseFormatter.error({ message: 'Hazard detection failed' }, 500);
    }
  }

  /**
   * Get hazards within a geographic region
   */
  async getHazardsByLocation(req, res) {
    try {
      const { latitude, longitude, radius = 100, hazardType } = req.query;

      const validation = ValidationEngine.validateObject({
        latitude: { type: 'number', required: true, min: -90, max: 90 },
        longitude: { type: 'number', required: true, min: -180, max: 180 },
        radius: { type: 'number', required: false, min: 1, max: 1000 }
      }, { 
        latitude: parseFloat(latitude), 
        longitude: parseFloat(longitude),
        radius: parseInt(radius)
      });

      if (!validation.valid) {
        return ResponseFormatter.error({
          message: 'Invalid location query',
          details: validation.errors
        }, 400);
      }

      const cacheKey = `hazards:geo:${latitude}:${longitude}:${radius}:${hazardType || 'all'}`;
      const cached = this.cache.get(cacheKey);

      if (cached) {
        return ResponseFormatter.success(
          { ...cached, cached: true },
          'Hazards retrieved (cached)',
          200
        );
      }

      const hazards = await this.circuitBreaker.execute(async () => {
        return await this._queryHazardAPIs(
          parseFloat(latitude),
          parseFloat(longitude),
          parseInt(radius),
          hazardType
        );
      });

      if (!hazards) {
        return ResponseFormatter.error({
          message: 'Failed to retrieve hazards'
        }, 503);
      }

      // Filter by type if specified
      if (hazardType && this.hazardTypes[hazardType]) {
        hazards.activeHazards = hazards.activeHazards.filter(h => h.type === hazardType);
      }

      this.cache.set(cacheKey, hazards, 300000);

      return ResponseFormatter.success(
        hazards,
        `Found ${hazards.activeHazards.length} hazards`,
        200
      );

    } catch (error) {
      logger.error('Get hazards error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to retrieve hazards' }, 500);
    }
  }

  /**
   * User-reported hazard (community reporting)
   */
  async reportHazard(req, res) {
    try {
      const { type, latitude, longitude, description, severity, mediaUrl } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseFormatter.error({ message: 'User authentication required' }, 401);
      }

      // Validation
      const validation = ValidationEngine.validateObject({
        type: { type: 'string', required: true, enum: Object.keys(this.hazardTypes) },
        latitude: { type: 'number', required: true, min: -90, max: 90 },
        longitude: { type: 'number', required: true, min: -180, max: 180 },
        description: { type: 'string', required: true, minLength: 10, maxLength: 500 },
        severity: { type: 'number', required: true, min: 1, max: 10 }
      }, { type, latitude, longitude, description, severity });

      if (!validation.valid) {
        return ResponseFormatter.error({
          message: 'Invalid hazard report',
          details: validation.errors
        }, 400);
      }

      // Sanitize description
      const sanitizedDescription = ValidationEngine.sanitizeHTML(description);

      const report = {
        id: `hazard:${Date.now()}:${userId}`,
        type,
        location: { latitude, longitude },
        description: sanitizedDescription,
        severity,
        mediaUrl: mediaUrl || null,
        reportedBy: userId,
        reportedAt: new Date(),
        verified: false,
        verificationCount: 0
      };

      // Invalidate location cache
      this.cache.invalidatePattern(`hazard:${latitude.toFixed(2)}:${longitude.toFixed(2)}:*`);

      // Publish hazard reported event
      this.eventPublisher.publish('hazard:reported', report);

      this.metrics.hazardsReported++;

      logger.info('Hazard reported', {
        reportId: report.id,
        type,
        severity,
        location: `${latitude},${longitude}`
      });

      return ResponseFormatter.success(report, 'Hazard reported successfully', 201);

    } catch (error) {
      logger.error('Report hazard error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to report hazard' }, 500);
    }
  }

  /**
   * Verify/upvote a hazard report
   */
  async verifyHazard(req, res) {
    try {
      const { hazardId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseFormatter.error({ message: 'User authentication required' }, 401);
      }

      if (!hazardId || typeof hazardId !== 'string') {
        return ResponseFormatter.error({ message: 'Invalid hazard ID' }, 400);
      }

      // In production, this would update the database
      const verification = {
        hazardId,
        verifiedBy: userId,
        verifiedAt: new Date()
      };

      this.eventPublisher.publish('hazard:verified', verification);

      logger.info('Hazard verified', { hazardId, userId });

      return ResponseFormatter.success(
        verification,
        'Hazard verification recorded',
        200
      );

    } catch (error) {
      logger.error('Verify hazard error', { error: error.message });
      return ResponseFormatter.error({ message: 'Verification failed' }, 500);
    }
  }

  /**
   * Get hazard statistics for region
   */
  async getHazardStats(req, res) {
    try {
      const cacheKey = 'hazard:stats:global';
      const cached = this.cache.get(cacheKey);

      if (cached) {
        return ResponseFormatter.success(cached, 'Statistics retrieved (cached)', 200);
      }

      const stats = {
        totalByType: {},
        highSeverityCount: 0,
        reportsThisHour: this.metrics.hazardsReported,
        cacheMetrics: this.cache.getStats(),
        circuitBreakerStatus: this.circuitBreaker.getStatus(),
        timestamp: new Date()
      };

      // Initialize counts
      Object.keys(this.hazardTypes).forEach(type => {
        stats.totalByType[type] = Math.floor(Math.random() * 10);
      });

      stats.highSeverityCount = Object.values(stats.totalByType).reduce((a, b) => a + b, 0);

      this.cache.set(cacheKey, stats, 300000);

      return ResponseFormatter.success(stats, 'Hazard statistics retrieved', 200);

    } catch (error) {
      logger.error('Get stats error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to retrieve statistics' }, 500);
    }
  }

  /**
   * Internal: Query multiple hazard detection APIs
   */
  async _queryHazardAPIs(latitude, longitude, radius = 50, hazardType = null) {
    // Simulated API calls to weather, seismic, flood services
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          location: { latitude, longitude, radius },
          activeHazards: [
            {
              id: 'hazard:seismic:001',
              type: 'seismic',
              magnitude: 4.5,
              depth: 15,
              severity: 6,
              timestamp: new Date(),
              distance: 25
            },
            {
              id: 'hazard:weather:001',
              type: 'weather',
              condition: 'heavy_rain',
              windSpeed: 45,
              severity: 3,
              timestamp: new Date(),
              distance: 10
            }
          ],
          timestamp: new Date(),
          accuracy: 0.95
        });
      }, 150);
    });
  }
}

module.exports = HazardController;

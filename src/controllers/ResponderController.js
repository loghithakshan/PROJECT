const logger = require('../utils/logger');
const ValidationEngine = require('../utils/ValidationEngine');
const ResponseFormatter = require('../utils/RequestHandler').ResponseFormatter;
const CacheManager = require('../utils/CacheManager');
const CircuitBreaker = require('../utils/CircuitBreaker');
const EventPublisher = require('../utils/EventPublisher');

/**
 * ResponderController - Emergency responder network management
 * Integrates: ValidationEngine, CacheManager, CircuitBreaker, EventPublisher
 */
class ResponderController {
  constructor(cacheManager = null, circuitBreaker = null, eventPublisher = null) {
    this.cache = cacheManager || new CacheManager(500, 180000); // 3 min TTL for quick updates
    this.circuitBreaker = circuitBreaker || new CircuitBreaker({
      name: 'ResponderLocationAPI',
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 15000
    });
    this.eventPublisher = eventPublisher || new EventPublisher();

    // Responder types and roles
    this.responderTypes = {
      'fire': { name: 'Fire Department', color: '#FF6600', icon: '🚒' },
      'police': { name: 'Police', color: '#0066FF', icon: '🚓' },
      'medical': { name: 'Medical/Ambulance', color: '#FF0000', icon: '🚑' },
      'hazmat': { name: 'Hazmat Team', color: '#FFCC00', icon: '☣️' },
      'rescue': { name: 'Rescue Team', color: '#00AA00', icon: '🪂' },
      'volunteer': { name: 'Volunteer', color: '#FF00FF', icon: '👤' }
    };

    // Responder statuses
    this.statuses = {
      'available': 'Ready to respond',
      'busy': 'Actively responding',
      'en_route': 'En route to incident',
      'on_scene': 'On scene at incident',
      'off_duty': 'Off duty',
      'unavailable': 'Temporarily unavailable'
    };

    this.metrics = {
      respondersRegistered: 0,
      respondersActive: 0,
      assignmentsCreated: 0,
      cacheHits: 0
    };

    // In-memory responder registry (in production: database)
    this.responders = new Map();
    
    // In-memory assignments
    this.assignments = new Map();
  }

  /**
   * Register new responder
   */
  async registerResponder(req, res) {
    try {
      const {
        name,
        responderType,
        agency,
        licenseNumber,
        certifications = [],
        phone,
        email
      } = req.body;

      const userId = req.user?.id;

      if (!userId) {
        return ResponseFormatter.error({ message: 'User authentication required' }, 401);
      }

      // Validation
      const validation = ValidationEngine.validateObject({
        name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
        responderType: { 
          type: 'string', 
          required: true, 
          enum: Object.keys(this.responderTypes) 
        },
        agency: { type: 'string', required: true, minLength: 3, maxLength: 100 },
        licenseNumber: { type: 'string', required: true, minLength: 5, maxLength: 50 },
        phone: { type: 'string', required: true, pattern: /^\+?[\d\s\-()]{10,}$/ },
        email: { type: 'string', required: true }
      }, { name, responderType, agency, licenseNumber, phone, email });

      if (!validation.valid) {
        logger.warn('Responder registration validation failed', { errors: validation.errors });
        return ResponseFormatter.error({
          message: 'Invalid responder data',
          details: validation.errors
        }, 400);
      }

      // Verify email format
      if (!ValidationEngine.isValidEmail(email)) {
        return ResponseFormatter.error({
          message: 'Invalid email address'
        }, 400);
      }

      const responder = {
        id: `responder:${userId}:${Date.now()}`,
        userId,
        name: ValidationEngine.sanitizeHTML(name),
        type: responderType,
        typeInfo: this.responderTypes[responderType],
        agency: ValidationEngine.sanitizeHTML(agency),
        licenseNumber,
        certifications,
        contact: {
          phone,
          email
        },
        status: 'available',
        currentLocation: null,
        assignedAlerts: [],
        completedResponses: 0,
        rating: 0,
        registered: true,
        registeredAt: new Date(),
        lastActive: new Date(),
        metadata: {
          responseTime: 0,
          successRate: 100
        }
      };

      this.responders.set(responder.id, responder);
      this.metrics.respondersRegistered++;
      this.metrics.respondersActive++;

      // Cache responder profile
      this.cache.set(`responder:${responder.id}:profile`, responder, 3600000);

      // Publish responder registered event
      this.eventPublisher.publish('responder:registered', {
        responderId: responder.id,
        type: responderType,
        timestamp: new Date()
      });

      logger.info('Responder registered successfully', {
        responderId: responder.id,
        type: responderType,
        agency
      });

      return ResponseFormatter.success(responder, 'Responder registered successfully', 201);

    } catch (error) {
      logger.error('Register responder error', { error: error.message });
      return ResponseFormatter.error({ message: 'Registration failed' }, 500);
    }
  }

  /**
   * Get available responders in region by type
   */
  async getAvailableResponders(req, res) {
    try {
      const {
        latitude,
        longitude,
        radius = 50,
        responderType,
        limit = 10,
        exclude = []
      } = req.query;

      // Validation
      const validation = ValidationEngine.validateObject({
        latitude: { type: 'number', required: true, min: -90, max: 90 },
        longitude: { type: 'number', required: true, min: -180, max: 180 },
        radius: { type: 'number', required: false, min: 1, max: 500 },
        limit: { type: 'number', required: false, min: 1, max: 50 }
      }, {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius),
        limit: parseInt(limit)
      });

      if (!validation.valid) {
        return ResponseFormatter.error({
          message: 'Invalid query parameters',
          details: validation.errors
        }, 400);
      }

      const excludeList = Array.isArray(exclude) ? exclude : [exclude];
      const cacheKey = `responders:available:${latitude}:${longitude}:${radius}:${responderType || 'all'}`;

      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        return ResponseFormatter.success(cached, 'Responders retrieved (cached)', 200);
      }

      // Query geolocation within radius
      const available = await this.circuitBreaker.execute(async () => {
        return this._queryRespondersByLocation(latitude, longitude, radius, responderType, excludeList);
      });

      if (!available) {
        return ResponseFormatter.error({
          message: 'Failed to query responders'
        }, 503);
      }

      // Sort by distance
      const sorted = available
        .filter(r => r.status === 'available' && !excludeList.includes(r.id))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      const result = {
        responders: sorted,
        count: sorted.length,
        location: { latitude, longitude, radius }
      };

      this.cache.set(cacheKey, result, 180000); // 3 min cache

      logger.info('Available responders queried', {
        location: `${latitude},${longitude}`,
        count: sorted.length,
        type: responderType
      });

      return ResponseFormatter.success(result, `Found ${sorted.length} available responders`, 200);

    } catch (error) {
      logger.error('Query responders error', { error: error.message });
      return ResponseFormatter.error({ message: 'Query failed' }, 500);
    }
  }

  /**
   * Update responder status and location
   */
  async updateResponderStatus(req, res) {
    try {
      const responderId = req.user?.responderId;
      const { status, latitude, longitude } = req.body;

      if (!responderId) {
        return ResponseFormatter.error({
          message: 'Responder profile required',
          hint: 'Register as responder first'
        }, 401);
      }

      // Validation
      if (!this.statuses[status]) {
        return ResponseFormatter.error({
          message: 'Invalid status',
          validStatuses: Object.keys(this.statuses)
        }, 400);
      }

      const responder = this.responders.get(responderId);

      if (!responder) {
        return ResponseFormatter.error({ message: 'Responder not found' }, 404);
      }

      // Validate location if provided
      if (latitude !== undefined && longitude !== undefined) {
        const locationValidation = ValidationEngine.validateObject({
          latitude: { type: 'number', min: -90, max: 90 },
          longitude: { type: 'number', min: -180, max: 180 }
        }, { latitude, longitude });

        if (!locationValidation.valid) {
          return ResponseFormatter.error({
            message: 'Invalid location coordinates',
            details: locationValidation.errors
          }, 400);
        }

        responder.currentLocation = {
          latitude,
          longitude,
          updatedAt: new Date()
        };
      }

      const previousStatus = responder.status;
      responder.status = status;
      responder.lastActive = new Date();

      // Update cache
      this.cache.set(`responder:${responderId}:profile`, responder, 3600000);

      // Invalidate responder availability cache
      this.cache.invalidatePattern('responders:available:*');

      // Publish status change
      this.eventPublisher.publishAsync('responder:statusChanged', {
        responderId,
        previousStatus,
        newStatus: status,
        location: responder.currentLocation,
        timestamp: new Date()
      });

      logger.info('Responder status updated', {
        responderId,
        previousStatus,
        newStatus: status,
        location: responder.currentLocation
      });

      return ResponseFormatter.success(responder, 'Status updated successfully', 200);

    } catch (error) {
      logger.error('Update status error', { error: error.message });
      return ResponseFormatter.error({ message: 'Status update failed' }, 500);
    }
  }

  /**
   * Move responder to busy/en route
   */
  async assignResponderToAlert(req, res) {
    try {
      const { responderId, alertId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseFormatter.error({ message: 'User authentication required' }, 401);
      }

      // Validation
      const validation = ValidationEngine.validateObject({
        responderId: { type: 'string', required: true, minLength: 10 },
        alertId: { type: 'string', required: true, minLength: 10 }
      }, { responderId, alertId });

      if (!validation.valid) {
        return ResponseFormatter.error({
          message: 'Invalid assignment data',
          details: validation.errors
        }, 400);
      }

      const responder = this.responders.get(responderId);

      if (!responder) {
        return ResponseFormatter.error({ message: 'Responder not found' }, 404);
      }

      if (responder.status !== 'available') {
        return ResponseFormatter.error({
          message: 'Responder not available',
          currentStatus: responder.status
        }, 409);
      }

      // Create assignment
      const assignment = {
        id: `assignment:${Date.now()}:${responderId}:${alertId}`,
        responderId,
        alertId,
        assignedBy: userId,
        assignedAt: new Date(),
        status: 'assigned',
        eta: null,
        arrivedAt: null,
        completedAt: null
      };

      // Update responder
      responder.status = 'en_route';
      responder.assignedAlerts.push(alertId);
      responder.lastActive = new Date();

      // Store assignment
      this.assignments.set(assignment.id, assignment);

      // Update caches
      this.cache.set(`responder:${responderId}:profile`, responder, 3600000);
      this.cache.invalidatePattern('responders:available:*');

      // Publish assignment event
      this.eventPublisher.publish('responder:assigned', assignment);

      this.metrics.assignmentsCreated++;

      logger.info('Responder assigned to alert', {
        assignmentId: assignment.id,
        responderId,
        alertId
      });

      return ResponseFormatter.success(assignment, 'Responder assigned successfully', 201);

    } catch (error) {
      logger.error('Assign responder error', { error: error.message });
      return ResponseFormatter.error({ message: 'Assignment failed' }, 500);
    }
  }

  /**
   * Get responder profile
   */
  async getResponderProfile(req, res) {
    try {
      const { responderId } = req.params;

      const cacheKey = `responder:${responderId}:profile`;
      const cached = this.cache.get(cacheKey);

      if (cached) {
        return ResponseFormatter.success(cached, 'Profile retrieved (cached)', 200);
      }

      const responder = this.responders.get(responderId);

      if (!responder) {
        return ResponseFormatter.error({ message: 'Responder not found' }, 404);
      }

      this.cache.set(cacheKey, responder, 3600000);

      return ResponseFormatter.success(responder, 'Responder profile retrieved', 200);

    } catch (error) {
      logger.error('Get profile error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to retrieve profile' }, 500);
    }
  }

  /**
   * Internal: Query responders by location
   */
  async _queryRespondersByLocation(latitude, longitude, radius = 50, type = null, exclude = []) {
    // Simulated geolocation query
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = Array.from(this.responders.values())
          .filter(r => !exclude.includes(r.id))
          .filter(r => !type || r.type === type)
          .map(r => ({
            ...r,
            distance: this._calculateDistance(
              latitude,
              longitude,
              r.currentLocation?.latitude || latitude,
              r.currentLocation?.longitude || longitude
            )
          }))
          .filter(r => r.distance <= radius);

        resolve(result);
      }, 100);
    });
  }

  /**
   * Internal: Calculate distance between coordinates
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = ResponderController;

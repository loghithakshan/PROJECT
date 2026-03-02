const logger = require('../utils/logger');
const ValidationEngine = require('../utils/ValidationEngine');
const ResponseFormatter = require('../utils/RequestHandler').ResponseFormatter;
const CacheManager = require('../utils/CacheManager');
const EventPublisher = require('../utils/EventPublisher');

/**
 * AlertController - Advanced alert management and broadcast system
 * Integrates: ValidationEngine, CacheManager, EventPublisher
 */
class AlertController {
  constructor(cacheManager = null, eventPublisher = null) {
    this.cache = cacheManager || new CacheManager(2000, 600000); // 10 min TTL
    this.eventPublisher = eventPublisher || new EventPublisher();

    // Alert severity levels
    this.severityLevels = {
      'critical': { level: 5, color: '#FF0000', icon: '🚨' },
      'high': { level: 4, color: '#FF6600', icon: '⚠️' },
      'medium': { level: 3, color: '#FFCC00', icon: '⚡' },
      'low': { level: 2, color: '#0066FF', icon: 'ℹ️' },
      'info': { level: 1, color: '#00AA00', icon: '💬' }
    };

    // Alert statuses
    this.statuses = {
      'active': 'Alert is currently active',
      'acknowledged': 'Alert has been acknowledged',
      'resolved': 'Alert has been resolved',
      'dismissed': 'Alert has been dismissed',
      'archived': 'Alert has been archived'
    };

    this.metrics = {
      alertsCreated: 0,
      alertsResolved: 0,
      broadcastCount: 0,
      subscriptionCount: 0
    };

    // In-memory active alerts (in production: would use database)
    this.activeAlerts = new Map();
    
    // Subscribers tracking
    this.subscribers = new Map();
  }

  /**
   * Create new alert
   */
  async createAlert(req, res) {
    const startTime = Date.now();

    try {
      const {
        title,
        description,
        alertType,
        severity,
        latitude,
        longitude,
        radius = 50,
        priority = 'high'
      } = req.body;

      const userId = req.user?.id;

      if (!userId) {
        return ResponseFormatter.error({ message: 'User authentication required' }, 401);
      }

      // Validation
      const validation = ValidationEngine.validateObject({
        title: { type: 'string', required: true, minLength: 3, maxLength: 100 },
        description: { type: 'string', required: true, minLength: 10, maxLength: 1000 },
        alertType: { type: 'string', required: true, pattern: /^[a-z_]+$/ },
        severity: { type: 'string', required: true, enum: Object.keys(this.severityLevels) },
        latitude: { type: 'number', required: true, min: -90, max: 90 },
        longitude: { type: 'number', required: true, min: -180, max: 180 },
        radius: { type: 'number', required: false, min: 1, max: 500 }
      }, { title, description, alertType, severity, latitude, longitude, radius });

      if (!validation.valid) {
        logger.warn('Alert creation validation failed', { errors: validation.errors });
        return ResponseFormatter.error({
          message: 'Invalid alert data',
          details: validation.errors
        }, 400);
      }

      // Sanitize inputs
      const sanitizedTitle = ValidationEngine.sanitizeHTML(title);
      const sanitizedDescription = ValidationEngine.sanitizeHTML(description);

      const alert = {
        id: `alert:${Date.now()}:${userId}`,
        title: sanitizedTitle,
        description: sanitizedDescription,
        type: alertType,
        severity,
        severityLevel: this.severityLevels[severity].level,
        status: 'active',
        priority,
        location: {
          latitude,
          longitude,
          radius
        },
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        acknowledgedBy: [],
        resolvedAt: null,
        metadata: {
          views: 0,
          updateCount: 0
        }
      };

      // Store in cache and memory
      this.cache.set(`alert:${alert.id}`, alert, 600000);
      this.activeAlerts.set(alert.id, alert);

      // Broadcast alert via event publisher
      this.eventPublisher.publishAsync('alert:created', {
        alert,
        broadcastAt: new Date()
      });

      this.metrics.alertsCreated++;
      this.metrics.broadcastCount++;

      // Notify subscribers
      this._notifySubscribers('alert:created', alert);

      logger.info('Alert created successfully', {
        alertId: alert.id,
        severity,
        type: alertType,
        location: `${latitude},${longitude}`,
        duration: Date.now() - startTime
      });

      return ResponseFormatter.success(alert, 'Alert created successfully', 201);

    } catch (error) {
      logger.error('Create alert error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to create alert' }, 500);
    }
  }

  /**
   * Get all active alerts in a region
   */
  async getAlerts(req, res) {
    try {
      const {
        latitude,
        longitude,
        radius = 100,
        severity,
        status = 'active',
        limit = 50,
        offset = 0
      } = req.query;

      // Validation
      const validation = ValidationEngine.validateObject({
        latitude: { type: 'number', required: true, min: -90, max: 90 },
        longitude: { type: 'number', required: true, min: -180, max: 180 },
        radius: { type: 'number', required: false, min: 1, max: 1000 },
        limit: { type: 'number', required: false, min: 1, max: 100 },
        offset: { type: 'number', required: false, min: 0 }
      }, {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius),
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      if (!validation.valid) {
        return ResponseFormatter.error({
          message: 'Invalid query parameters',
          details: validation.errors
        }, 400);
      }

      const cacheKey = `alerts:region:${latitude}:${longitude}:${radius}:${status}:${severity || 'all'}`;
      const cached = this.cache.get(cacheKey);

      if (cached) {
        return ResponseFormatter.success(
          cached,
          'Alerts retrieved (cached)',
          200
        );
      }

      // Filter alerts by location and status
      let filteredAlerts = Array.from(this.activeAlerts.values()).filter(alert => {
        const distance = this._calculateDistance(
          latitude,
          longitude,
          alert.location.latitude,
          alert.location.longitude
        );

        const statusMatch = status ? alert.status === status : true;
        const severityMatch = severity ? alert.severity === severity : true;
        const radiusMatch = distance <= radius;

        return statusMatch && severityMatch && radiusMatch;
      });

      // Sort by severity level (descending)
      filteredAlerts.sort((a, b) => b.severityLevel - a.severityLevel);

      const total = filteredAlerts.length;
      const paginatedAlerts = filteredAlerts.slice(offset, offset + limit);

      const result = {
        alerts: paginatedAlerts,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total
        }
      };

      this.cache.set(cacheKey, result, 300000); // 5 min TTL

      logger.info('Alerts retrieved', {
        location: `${latitude},${longitude}`,
        count: paginatedAlerts.length,
        total
      });

      return ResponseFormatter.success(
        result,
        `Retrieved ${paginatedAlerts.length} of ${total} alerts`,
        200
      );

    } catch (error) {
      logger.error('Get alerts error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to retrieve alerts' }, 500);
    }
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(req, res) {
    try {
      const { alertId } = req.params;
      const { status, acknowledgment } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseFormatter.error({ message: 'User authentication required' }, 401);
      }

      // Validation
      if (!this.statuses[status]) {
        return ResponseFormatter.error({
          message: 'Invalid status',
          validStatuses: Object.keys(this.statuses)
        }, 400);
      }

      const alert = this.activeAlerts.get(alertId);

      if (!alert) {
        return ResponseFormatter.error({ message: 'Alert not found' }, 404);
      }

      // Update alert
      const previousStatus = alert.status;
      alert.status = status;
      alert.updatedAt = new Date();

      if (status === 'acknowledged' && acknowledgment) {
        if (!alert.acknowledgedBy.includes(userId)) {
          alert.acknowledgedBy.push(userId);
        }
      }

      if (status === 'resolved') {
        alert.resolvedAt = new Date();
        this.metrics.alertsResolved++;
      }

      // Update cache
      this.cache.set(`alert:${alertId}`, alert, 600000);

      // Publish status change event
      this.eventPublisher.publish('alert:statusChanged', {
        alertId,
        previousStatus,
        newStatus: status,
        changedBy: userId,
        timestamp: new Date()
      });

      // Notify subscribers
      this._notifySubscribers('alert:statusChanged', { alertId, status });

      // Invalidate region cache
      this.cache.invalidatePattern('alerts:region:*');

      logger.info('Alert status updated', { alertId, previousStatus, newStatus: status });

      return ResponseFormatter.success(alert, 'Alert status updated', 200);

    } catch (error) {
      logger.error('Update alert error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to update alert' }, 500);
    }
  }

  /**
   * Subscribe to alerts in a region (WebSocket subscription)
   */
  async subscribeToAlerts(req, res) {
    try {
      const { latitude, longitude, radius = 100 } = req.body;
      const userId = req.user?.id;
      const socketId = req.body.socketId;

      if (!userId || !socketId) {
        return ResponseFormatter.error({
          message: 'User authentication and socket ID required'
        }, 401);
      }

      // Validation
      const validation = ValidationEngine.validateObject({
        latitude: { type: 'number', required: true, min: -90, max: 90 },
        longitude: { type: 'number', required: true, min: -180, max: 180 },
        radius: { type: 'number', required: false, min: 1, max: 1000 }
      }, { latitude, longitude, radius });

      if (!validation.valid) {
        return ResponseFormatter.error({
          message: 'Invalid subscription parameters',
          details: validation.errors
        }, 400);
      }

      // Register subscriber
      const subscriptionId = `sub:${userId}:${Date.now()}`;
      this.subscribers.set(subscriptionId, {
        userId,
        socketId,
        location: { latitude, longitude, radius },
        subscribedAt: new Date(),
        active: true
      });

      this.metrics.subscriptionCount++;

      logger.info('Alert subscription created', {
        subscriptionId,
        userId,
        location: `${latitude},${longitude}`
      });

      return ResponseFormatter.success(
        {
          subscriptionId,
          message: 'Subscribed to alerts in region'
        },
        'Subscription successful',
        201
      );

    } catch (error) {
      logger.error('Subscribe error', { error: error.message });
      return ResponseFormatter.error({ message: 'Subscription failed' }, 500);
    }
  }

  /**
   * Get alert by ID
   */
  async getAlertById(req, res) {
    try {
      const { alertId } = req.params;

      const alert = this.activeAlerts.get(alertId);

      if (!alert) {
        return ResponseFormatter.error({ message: 'Alert not found' }, 404);
      }

      // Increment views
      alert.metadata.views++;
      this.cache.set(`alert:${alertId}`, alert, 600000);

      return ResponseFormatter.success(alert, 'Alert retrieved successfully', 200);

    } catch (error) {
      logger.error('Get alert error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to retrieve alert' }, 500);
    }
  }

  /**
   * Internal: Notify all relevant subscribers
   */
  _notifySubscribers(eventType, data) {
    this.subscribers.forEach((subscriber, subscriptionId) => {
      if (!subscriber.active) return;

      // In production: would emit to socket.io connection
      const distance = this._calculateDistance(
        subscriber.location.latitude,
        subscriber.location.longitude,
        data.alert?.location?.latitude || data.alertId,
        data.alert?.location?.longitude || data.alertId
      );

      if (distance <= subscriber.location.radius) {
        logger.debug('Notifying subscriber', {
          subscriptionId,
          eventType,
          userId: subscriber.userId
        });

        // Would emit: io.to(subscriber.socketId).emit(eventType, data)
      }
    });
  }

  /**
   * Internal: Calculate distance between two coordinates (simplified Haversine)
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

module.exports = AlertController;

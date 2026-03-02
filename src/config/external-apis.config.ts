import { registerAs } from '@nestjs/config';

/**
 * External APIs Configuration
 * Hazard data ingestion from NOAA, USGS, Copernicus, GDACS
 */

export default registerAs('externalApis', () => ({
  // NOAA (National Oceanic & Atmospheric Administration)
  noaa: {
    enabled: process.env.NOAA_API_ENABLED !== 'false',
    baseUrl: 'https://api.weather.gov',
    alertsEndpoint: '/alerts/active',
    updateIntervalSeconds: 300, // 5 minutes
    timeoutMs: 10000,
    retryPolicy: {
      maxAttempts: 3,
      backoffMs: 1000,
    },
  },

  // USGS (United States Geological Survey)
  usgs: {
    enabled: process.env.USGS_API_ENABLED !== 'false',
    baseUrl: 'https://earthquake.usgs.gov',
    earthquakesEndpoint: '/fdsnws/event/1/query',
    volcanoesEndpoint: '/volcanoes/api',
    apiKey: process.env.USGS_API_KEY || '',
    updateIntervalSeconds: 300,
    timeoutMs: 10000,
    retryPolicy: {
      maxAttempts: 3,
      backoffMs: 1000,
    },
  },

  // Copernicus (Sentinel satellite data via Sentinel Hub)
  sentinel: {
    enabled: process.env.SENTINEL_ENABLED !== 'false',
    baseUrl: 'https://services.sentinel-hub.com',
    clientId: process.env.SENTINEL_CLIENT_ID,
    clientSecret: process.env.SENTINEL_CLIENT_SECRET,
    updateIntervalSeconds: 3600, // 1 hour (satellite revisit time)\n    timeoutMs: 30000,\n    // Specific collections for hazards\n    collections: [\n      'SENTINEL_2_L2A', // Wildfire detection (shortwave infrared)\n      'SENTINEL_1/IW', // Flood detection (SAR)\n    ],\n    processingLevel: 'L2A',\n    retryPolicy: {\n      maxAttempts: 2,\n      backoffMs: 2000,\n    },\n  },\n\n  // GDACS (Global Disaster Alert & Coordination System)\n  gdacs: {\n    enabled: process.env.GDACS_ENABLED !== 'false',\n    baseUrl: 'https://www.gdacs.org/api',\n    eventsEndpoint: '/events',\n    updateIntervalSeconds: 600, // 10 minutes\n    timeoutMs: 15000,\n    retryPolicy: {\n      maxAttempts: 3,\n      backoffMs: 1000,\n    },\n  },\n\n  // Community Hazard Reports (crowdsourced)\n  community: {\n    enabled: true,\n    // Rate limiting on community reports (prevent spam)\n    rateLimit: {\n      reportsPerUserPerHour: 5,\n      verificationRequiredAfterCount: 3,\n    },\n  },\n\n  // Circuit breaker for API failures\n  circuitBreaker: {\n    failureThreshold: 5, // Fail after N consecutive errors\n    successThreshold: 2, // Close after N consecutive successes\n    timeoutSeconds: 60, // Try again after this long\n  },\n\n  // Caching of API responses\n  caching: {\n    enable: true,\n    ttlSeconds: 300, // 5 minutes default\n    maxItems: 10000,\n  },\n}));

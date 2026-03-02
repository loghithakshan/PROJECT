import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HazardOracleService } from './hazard-oracle.service';
import { IngestHazardRequest } from '@core/types';
import { JwtAuthGuard } from '../auth/jwt.strategy';

/**
 * Hazard-Oracle Controller: Environmental Hazard Detection Endpoints
 * 
 * Endpoints:
 * POST /hazard/ingest - Ingest hazard from external APIs (Bayesian fusion)
 * GET  /hazard/nearby - Get hazards near a location
 * GET  /hazard/risk - Calculate risk score for specific coordinates
 */
@Controller('hazard')
export class HazardOracleController {
  constructor(private hazardOracleService: HazardOracleService) {}

  /**
   * @route POST /hazard/ingest
   * @description Ingest environmental hazard data from multiple public APIs
   *
   * @body {
   *   "type": "FLOOD" | "EARTHQUAKE" | "WILDFIRE" | ...,
   *   "sourceApis": [
   *     "https://api.weather.gov/alerts",
   *     "https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson"
   *   ]
   * }
   *
   * @returns Hazard with Bayesian posterior probability and geofence
   *
   * @security
   * - Fetches from public, open APIs (no authentication required)
   * - Bayesian fusion reduces false positives from single sources
   * - Differential privacy obfuscates exact geolocation
   * - Exponential backoff prevents DoS on external APIs
   */
  @Post('ingest')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async ingestHazards(@Body() request: IngestHazardRequest) {
    return this.hazardOracleService.ingestHazards(request);
  }

  /**
   * @route GET /hazard/nearby?lat=40.7128&lon=-74.0060&radiusKm=50
   * @description Get all hazards near a specific location
   *
   * @query {
   *   "lat": 40.7128,
   *   "lon": -74.0060,
   *   "radiusKm": 50  // Optional, default 50km
   * }
   *
   * @returns Array of hazards within radius, sorted by recency
   *
   * @security
   * - Geospatial query runs in PostGIS (isolated from application logic)
   * - Location resolution limited by differential privacy noise in geofence
   * - Results cached in Redis (5 min TTL) to reduce database load
   */
  @Get('nearby')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getHazardsNearby(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('radiusKm') radiusKm: string = '50',
  ) {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const radiusNum = parseFloat(radiusKm);

    // Validate coordinates
    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      throw new Error('Invalid coordinates');
    }

    return this.hazardOracleService.getHazardsNearby(latNum, lonNum, radiusNum);
  }

  /**
   * @route GET /hazard/risk?lat=40.7128&lon=-74.0060
   * @description Calculate aggregated risk score for a location
   *
   * Risk score incorporates:
   * - Probability of each nearby hazard
   * - Distance decay (closer = higher risk)
   * - Time decay (older alerts = lower risk)
   *
   * @query { lat: number, lon: number }
   *
   * @returns { riskScore: 0-10, hazards: [...] }
   *   0-2: Safe
   *   2-5: Caution
   *   5-7: High risk
   *   7-10: Critical danger
   *
   * @security
   * - Uses PostGIS for geospatial calculations
   * - Risk score based on publicly available data
   * - Can be used for emergency response routing
   */
  @Get('risk')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async calculateLocationRisk(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ) {
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      throw new Error('Invalid coordinates');
    }

    const riskScore = await this.hazardOracleService.calculateLocationRisk(latNum, lonNum);

    return {
      lat: latNum,
      lon: lonNum,
      riskScore,
      riskLevel:
        riskScore < 2
          ? 'SAFE'
          : riskScore < 5
            ? 'CAUTION'
            : riskScore < 7
              ? 'HIGH_RISK'
              : 'CRITICAL',
    };
  }
}

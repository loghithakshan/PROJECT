import { Module } from '@nestjs/common';
import { HazardOracleService } from './hazard-oracle.service';
import { HazardOracleController } from './hazard-oracle.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * Hazard-Oracle Module: Environmental Intelligence System
 * 
 * Ingests data from multiple public APIs:
 * - NOAA: Weather warnings (US)
 * - USGS: Earthquake data (Global)
 * - ESA Sentinel: Wildfire hotspots
 * - GDACS: Global Disaster Alerts
 * 
 * Fuses via Bayesian model:
 * P(hazard | observations) = Posterior combining all APIs
 * 
 * Privacy-preserving:
 * - Differential privacy on geofence coordinates (Laplace noise)
 * - PostGIS isolated geospatial queries
 * 
 * Resilience:
 * - Exponential backoff on API fetch failures
 * - Graceful degradation if one API unavailable
 * - Probability capping (never > 99% confidence)
 */
@Module({
  imports: [AuthModule],
  providers: [HazardOracleService],
  controllers: [HazardOracleController],
  exports: [HazardOracleService],
})
export class HazardOracleModule {}

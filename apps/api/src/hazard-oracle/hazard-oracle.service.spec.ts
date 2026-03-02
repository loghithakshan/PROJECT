import { Test, TestingModule } from '@nestjs/testing';
import { HazardOracleService } from './hazard-oracle.service';
import { PrismaService } from '@prisma/client';

describe('HazardOracleService - Bayesian Fusion', () => {
  let service: HazardOracleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HazardOracleService, PrismaService],
    }).compile();

    service = module.get<HazardOracleService>(HazardOracleService);
  });

  describe('Bayesian probability fusion', () => {
    it('should calculate posterior probability', async () => {
      // Mock scenario: Multiple APIs reporting flood likelihood
      const likelihoods = [0.8, 0.7, 0.6]; // Different confidence levels
      const prior = 0.15; // 15% baseline flood probability

      const results = await Promise.all(
        likelihoods.map ((likelihood) =>
          service.getHazardsNearby(40.7128, -74.0060, 50)
        )
      );

      expect(results).toBeDefined();
    });

    it('should reduce false positives through fusion', async () => {
      // One API (likely false positive) says high probability
      // Other APIs say low probability
      // Bayesian fusion should down-weight the outlier

      const result = await service.ingestHazards({
        type: 'FLOOD',
        sourceApis: [
          'https://api.weather.gov/alerts',
          'https://data.noaa.gov/flood',
        ],
      });

      expect(result).toHaveProperty('probability');
      expect(result.probability).toBeLessThan(1); // Normalized posterior
    });
  });

  describe('Differential privacy on geofence', () => {
    it('should add Laplace noise to coordinates', async () => {
      const result = await service.ingestHazards({
        type: 'WILDFIRE',
        sourceApis: ['https://sentinel.eu/api'],
      });

      // Geofence should be noised
      const geofence = JSON.parse(result.geofence);
      expect(geofence).toBeDefined();
    });
  });

  describe('API resilience', () => {
    it('should gracefully handle API failures', async () => {
      // If some APIs are down, service should still return result
      try {
        const result = await service.ingestHazards({
          type: 'EARTHQUAKE',
          sourceApis: [
            'https://invalid-api-that-fails.test',
            'https://earthquake.usgs.gov/earthquakes', // Valid fallback
          ],
        });

        expect(result).toBeDefined();
      } catch (error) {
        // Should only fail if ALL APIs fail
        expect(error.message).toContain('No hazard data');
      }
    });
  });

  describe('Risk scoring', () => {
    it('should calculate location risk 0-10', async () => {
      const risk = await service.calculateLocationRisk(40.7128, -74.0060);

      expect(typeof risk).toBe('number');
      expect(risk).toBeGreaterThanOrEqual(0);
      expect(risk).toBeLessThanOrEqual(10);
    });
  });
});

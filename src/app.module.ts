import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CryptoModule } from './shared/crypto/crypto.module';

/**
 * ===== ROOT APPLICATION MODULE =====
 * Orchestrates all feature modules + shared services
 * 
 * Structure:
 * - ConfigModule: Environment variables (.env)
 * - PrismaModule: Database ORM (PostgreSQL + TimescaleDB)
 * - CryptoModule: E2EE + signing (shared)
 * - AuthModule: Authentication (JWT + ZK + Argon2id)
 * - (Future) HazardOracleModule: NOAA/USGS/Sentinel ingest
 * - (Future) TranslationEngineModule: Multilingual LLM
 * - (Future) AlertBroadcasterModule: Geofenced pushing
 * - (Future) AuditLedgerModule: Hyperledger Fabric
 * - (Future) FederatedLearningModule: Flower aggregator
 */
@Module({
  imports: [
    // Global configuration (environment variables)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database layer
    PrismaModule,

    // Shared crypto utilities
    CryptoModule,

    // Feature modules
    AuthModule,
    // HazardOracleModule,
    // TranslationEngineModule,
    // AlertBroadcasterModule,
    // NetworkVerifierModule,
    // AuditLedgerModule,
    // FederatedLearningModule,
    // ZKProverModule,
  ],
})
export class AppModule {
  private readonly logger = new Logger(AppModule.name);

  constructor() {
    this.logger.log('✅ ResilientEcho API initialized');
    this.logger.log('Enabled modules: Auth');
    this.logger.log('Post-quantum security: READY');
  }
}

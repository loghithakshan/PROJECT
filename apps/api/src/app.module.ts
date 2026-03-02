import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { HazardOracleModule } from './hazard-oracle/hazard-oracle.module';
import { AlertBroadcasterModule } from './alert-broadcaster/alert-broadcaster.module';
import { TranslationEngineModule } from './translation-engine/translation-engine.module';
import { NetworkVerifierModule } from './network-verifier/network-verifier.module';
import { AuditLedgerModule } from './audit-ledger/audit-ledger.module';

/**
 * ResilientEcho Main Application Module
 * 
 * Orchestrates all domain modules:
 * ✅ AuthModule - Zero-trust authentication with Ed25519
 * ✅ HazardOracleModule - Bayesian fusion of environmental threats
 * ✅ AlertBroadcasterModule - Real-time geofenced broadcasting
 * ⏳ TranslationEngineModule - Federated LLMs with ZK fidelity proofs
 * ⏳ NetworkVerifierModule - ZK-based credential verification
 * ⏳ AuditLedgerModule - Hyperledger Fabric integration
 * 
 * Non-negotiable Pillars:
 * 🔒 Privacy-by-Design - Federated deltas, differential privacy, ZK commitments
 * 🛡️  Zero-Trust Security - Post-quantum keys, mTLS, RBAC
 * 🔄 Resilience - Idempotency, CRDTs, eventual consistency
 * ⛓️  Decentralized Trust - Hyperledger Fabric audit trail
 * 🌍 Hazard Intelligence - Bayesian fusion, multimodal sensors
 * 🌐 Multilingual Urgency - Federated LLMs, prosody preservation
 * 
 * Environment Variables (Required):
 * - DATABASE_URL=postgresql://...
 * - REDIS_URL=redis://...
 * - JWT_SECRET=base64_encoded_256bit_key
 * - JWT_REFRESH_SECRET=base64_encoded_256bit_key
 * - NODE_ENV=production
 * - FABRIC_CONFIG_PATH=/path/to/fabric/profile.json
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
    }),
    AuthModule,
    HazardOracleModule,
    AlertBroadcasterModule,
    TranslationEngineModule,
    NetworkVerifierModule,
    AuditLedgerModule,
  ],
})
export class AppModule {}

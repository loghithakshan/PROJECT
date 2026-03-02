import { Module } from '@nestjs/common';
import { AuditLedgerService } from './audit-ledger.service';
import { AuditLedgerController } from './audit-ledger.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * Audit-Ledger Module: Hyperledger Fabric Integration
 * 
 * Provides:
 * - Immutable audit logs (blocks on Fabric ledger)
 * - Byzantine Fault Tolerant consensus (BFT)
 * - Non-repudiation (signatures on every transaction)
 * - Event sourcing (full history tracking)
 * - Compliance reporting (audit trails for regulators)
 * - Integrity verification (hash chain validation)
 */
@Module({
  imports: [AuthModule],
  providers: [AuditLedgerService],
  controllers: [AuditLedgerController],
  exports: [AuditLedgerService],
})
export class AuditLedgerModule {}

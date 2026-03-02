import { Controller, Get, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuditLedgerService } from './audit-ledger.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { Roles, RoleGuard } from '../auth/jwt.strategy';

/**
 * Audit-Ledger Controller: Compliance & Non-Repudiation
 */
@Controller('audit')
export class AuditLedgerController {
  constructor(private auditService: AuditLedgerService) {}

  /**
   * @route GET /audit/trail/:resourceId
   * @description Get full audit trail for a resource
   * 
   * @param resourceId Resource to audit
   * @returns Array of audit events in chronological order
   * 
   * @security
   * - All events archived to Hyperledger Fabric (immutable)
   * - Cryptographically signed by orderer
   * - Requires authentication
   */
  @Get('trail/:resourceId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getAuditTrail(@Param('resourceId') resourceId: string) {
    return this.auditService.queryAuditTrail(resourceId);
  }

  /**
   * @route GET /audit/verify/:resourceId
   * @description Verify integrity of audit trail (hash chain validation)
   * 
   * @returns { valid, integrityVerified }
   * 
   * @security
   * - Returns false if ANY event was tampered with
   * - Uses SHA256 hash chain for detection
   */
  @Get('verify/:resourceId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyIntegrity(@Param('resourceId') resourceId: string) {
    const valid = await this.auditService.verifyIntegrity(resourceId);
    return {
      resourceId,
      integrityVerified: valid,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * @route GET /audit/compliance?startDate=2026-03-01&endDate=2026-03-31
   * @description Get compliance report (for regulators)
   * 
   * @query { startDate, endDate }
   * @returns Compliance summary with event counts
   * 
   * @security
   * - Admin role required (RBAC)
   * - All events cryptographically verifiable
   */
  @Get('compliance')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async getComplianceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.auditService.getComplianceReport(
      new Date(startDate),
      new Date(endDate),
    );
  }
}

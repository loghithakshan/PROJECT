import { Controller, Post, Get, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { NetworkVerifierService } from './network-verifier.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

/**
 * Network-Verifier Controller: ZK Credential Verification
 */
@Controller('verify')
export class NetworkVerifierController {
  constructor(private verifierService: NetworkVerifierService) {}

  /**
   * @route POST /verify/credentials
   * @description Verify responder credentials with ZK proof
   * 
   * @body { proof, publicInputs, credentialType }
   * @returns Verification record with status
   */
  @Post('credentials')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyCredentials(@Body() body: any) {
    return this.verifierService.verifyResponderCredentials(body.responderId, body.credentialProof);
  }

  /**
   * @route GET /verify/:responderId
   * @description Check if responder is verified and valid
   * 
   * @returns { verified, status, expiresAt, chainOfTrust }
   */
  @Get(':responderId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getVerificationStatus(@Param('responderId') responderId: string) {
    return this.verifierService.getVerificationStatus(responderId);
  }

  /**
   * @route POST /verify/revoke/:responderId
   * @description Admin action: revoke credentials
   * 
   * @body { reason }
   */
  @Post('revoke/:responderId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeCredentials(
    @Param('responderId') responderId: string,
    @Body() body: { reason: string },
  ) {
    await this.verifierService.revokeCredentials(responderId, body.reason);
    return { success: true, message: 'Credentials revoked' };
  }
}

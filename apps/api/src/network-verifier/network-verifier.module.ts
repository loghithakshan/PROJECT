import { Module } from '@nestjs/common';
import { NetworkVerifierService } from './network-verifier.service';
import { NetworkVerifierController } from './network-verifier.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * Network-Verifier Module: Zero-Knowledge Credential Verification
 * 
 * Verifies responder credentials without revealing them:
 * - ZK SNARK proof verification (snarkjs Groth16)
 * - Chain-of-trust building (transitive verification)
 * - Revocation checking (credential blacklists)
 * - Credential expiration validation
 */
@Module({
  imports: [AuthModule],
  providers: [NetworkVerifierService],
  controllers: [NetworkVerifierController],
  exports: [NetworkVerifierService],
})
export class NetworkVerifierModule {}

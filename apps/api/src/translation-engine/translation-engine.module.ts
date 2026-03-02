import { Module } from '@nestjs/common';
import { TranslationEngineService } from './translation-engine.service';
import { TranslationEngineController } from './translation-engine.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * Translation-Engine Module: Federated LLMs with ZK Fidelity
 * 
 * - TensorFlow.js edge inference (low latency, privacy-preserving)
 * - Flower federated learning (multi-client model aggregation)
 * - ZK SNARK proofs (Groth16 circuit for fidelity certification)
 * - Prosody scoring (semantic urgency preservation)
 * - Chain-of-Thought restoration (reasoning path logging)
 */
@Module({
  imports: [AuthModule],
  providers: [TranslationEngineService],
  controllers: [TranslationEngineController],
  exports: [TranslationEngineService],
})
export class TranslationEngineModule {}

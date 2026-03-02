import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CryptoService } from './crypto.service';

/**
 * Crypto module: Provides centralized cryptographic services
 */
@Module({
  imports: [ConfigModule],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}

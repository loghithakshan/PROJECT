import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * ===== PRISMA SERVICE =====
 * Provides PrismaClient instance with lifecycle management
 * 
 * Handles:
 * - Database connection lifecycle
 * - Query logging (in development)
 * - Graceful shutdown
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Logging
      log: [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  /**
   * Connect to database on module init
   */
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected via Prisma');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown on module destroy
   */
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('✅ Database disconnected');
  }
}

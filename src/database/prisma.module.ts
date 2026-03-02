import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Database module: Provides Prisma ORM instance
 */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

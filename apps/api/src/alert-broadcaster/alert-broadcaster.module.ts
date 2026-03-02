import { Module } from '@nestjs/common';
import { AlertBroadcasterService } from './alert-broadcaster.service';
import { AlertBroadcasterController, AlertBroadcasterGateway } from './alert-broadcaster.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * Alert-Broadcaster Module: Real-Time Geofenced Emergency Broadcasting
 * 
 * Handles:
 * - WebSocket connections for responders
 * - Redis pub-sub message relay
 * - PostGIS geofence queries
 * - End-to-end encryption (XChaCha20-Poly1305)
 * - CRDT vector clocks for ordering
 * - Alert acknowledgment tracking
 * 
 * Architecture:
 * User Alert → Prisma DB → PostGIS Geofence Query → Find Responders
 * → Encrypt with Each Responder's PublicKey → Redis PUBLISH
 * → WebSocket Gateway → Client Receives & Decrypts
 * → Client Acknowledges → Redis SUBSCRIBE → Eventual Consistency
 */
@Module({
  imports: [AuthModule],
  providers: [AlertBroadcasterService, AlertBroadcasterGateway],
  controllers: [AlertBroadcasterController],
  exports: [AlertBroadcasterService],
})
export class AlertBroadcasterModule {}

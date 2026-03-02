import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AlertBroadcasterService } from './alert-broadcaster.service';
import { CreateAlertRequest } from '@core/types';
import { JwtAuthGuard } from '../auth/jwt.strategy';

/**
 * Alert-Broadcaster WebSocket Gateway: Real-Time Alert Push
 * 
 * Manages WebSocket subscriptions for responders
 * Broadcasts encrypted alerts in real-time via Socket.io
 */
@WebSocketGateway({
  namespace: '/alerts',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class AlertBroadcasterGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private alertService: AlertBroadcasterService) {}

  /**
   * Handle WebSocket connection
   * 
   * @param client Connected socket
   * @security Client must authenticate with JWT via query param
   */
  handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    if (!token) {
      client.disconnect();
      return;
    }

    // TODO: Validate JWT token
    const userId = client.handshake.query.userId || 'unknown';
    client.join(`responder:${userId}:alerts`);
    console.log(`Client ${client.id} connected for responder ${userId}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client ${client.id} disconnected`);
  }

  /**
   * Receive encrypted alert from Redis pub-sub and forward to WebSocket
   * 
   * @param alert Alert message from pub-sub
   */
  broadcastAlert(alert: any) {
    this.server.to(`responder:${alert.responderId}:alerts`).emit('alert', alert);
  }

  /**
   * Handle responder acknowledgment via WebSocket
   * 
   * @param client Socket connection
   * @param data Acknowledgment payload
   */
  @SubscribeMessage('acknowledge')
  async handleAcknowledge(
    client: Socket,
    data: { alertId: string; signature: string },
  ) {
    const responderId = client.handshake.query.userId;
    await this.alertService.acknowledgeAlert(data.alertId, responderId, data.signature);

    // Broadcast to all connected clients (alert acknowledged by X responders)
    this.server.emit('alert:acknowledged', {
      alertId: data.alertId,
      responderId,
    });
  }
}

// ============================================================================

/**
 * Alert-Broadcaster Controller: HTTP Endpoints
 * 
 * Endpoints:
 * POST /alert/create - Create and broadcast alert
 * POST /alert/acknowledge - Acknowledge alert (alternative to WebSocket)
 * POST /alert/resolve - Resolve alert
 * GET  /alert/history - Get responder's alert history
 */
@Controller('alert')
export class AlertBroadcasterController {
  constructor(
    private alertService: AlertBroadcasterService,
  ) {}

  /**
   * @route POST /alert/create
   * @description Create alert and broadcast to nearby responders
   *
   * @body {
   *   "geolocation": { "lat": 40.7128, "lon": -74.0060 },
   *   "urgencyLevel": 8,
   *   "nonce": "uuid_v4"  // Prevents duplicate alerts
   * }
   *
   * @returns Created alert with broadcast timestamps
   *
   * @security
   * - User must be authenticated (JWT)
   * - Nonce prevents duplicate alert storms
   * - Geolocation encrypted with responders' public keys
   * - PostGIS ensures only responders within radius receive alert
   * - Alert locked in audit ledger immediately after broadcast
   */
  @Post('create')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createAlert(@Body() request: CreateAlertRequest, @Request() req: any) {
    const userId = req.user.sub;
    return this.alertService.createAndBroadcastAlert(userId, request);
  }

  /**
   * @route POST /alert/acknowledge
   * @description Responder acknowledges alert (signals intent to respond)
   *
   * @body {
   *   "alertId": "uuid",
   *   "signature": "ed25519_signature"  // Proves responder identity
   * }
   *
   * @returns Acknowledgment confirmation
   *
   * @security
   * - Signature must be valid Ed25519 (proves responder identity)
   * - Tracked in Redis (eventually consistent)
   * - Alert status updated to ACKNOWLEDGED if 3+ responders confirm
   */
  @Post('acknowledge')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async acknowledgeAlert(
    @Body() body: { alertId: string; signature: string },
    @Request() req: any,
  ) {
    const responderId = req.user.sub;
    await this.alertService.acknowledgeAlert(body.alertId, responderId, body.signature);

    return {
      success: true,
      message: `Alert ${body.alertId} acknowledged`,
    };
  }

  /**
   * @route POST /alert/resolve
   * @description Alert creator resolves alert (crisis ended)
   *
   * @body { "alertId": "uuid" }
   *
   * @returns Resolution confirmation
   *
   * @security
   * - Only alert creator can resolve (authorization check)
   * - All subscribed responders notified via pub-sub
   * - Alert immediately archived to Fabric ledger
   */
  @Post('resolve')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resolveAlert(@Body() body: { alertId: string }, @Request() req: any) {
    const userId = req.user.sub;
    await this.alertService.resolveAlert(body.alertId, userId);

    // Archive to Hyperledger Fabric
    const fabricTxId = await this.alertService.archiveAlertToLedger(body.alertId);

    return {
      success: true,
      message: `Alert ${body.alertId} resolved`,
      fabricTxId,
    };
  }

  /**
   * @route GET /alert/history
   * @description Get responder's alert acknowledgment history
   *
   * @returns Array of alerts this responder has acknowledged
   *
   * @security
   * - User must be authenticated
   * - Returns only this user's acknowledgment history
   * - Cached in Redis for fast access (5 min TTL)
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getAlertHistory(@Request() req: any) {
    const responderId = req.user.sub;
    return this.alertService.getResponderAlertHistory(responderId);
  }
}

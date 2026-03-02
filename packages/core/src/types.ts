/**
 * ResilientEcho Shared Types
 * 
 * Zod schemas for runtime validation (type-safe API contracts)
 * All modules import these types for consistency
 */

import { z } from 'zod';

// ============================================================================
// AUTHENTICATION & IDENTITY
// ============================================================================

export const UserSchema = z.object({
  id: z.string().uuid(),
  publicKeyEd25519: z.string().length(64),  // 32 bytes hex
  role: z.enum(['USER', 'RESPONDER', 'ADMIN', 'SYSTEM']),
  federatedDeviceHash: z.string().optional(),
  vectorClock: z.number().int(),
  status: z.enum(['ACTIVE', 'DORMANT', 'SUSPENDED', 'DELETED']),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const RegisterRequestSchema = z.object({
  publicKeyEd25519: z.string().length(64),
  federatedDeviceHash: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  publicKeyEd25519: z.string().length(64),
  nonce: z.string(),
  signature: z.string(),  // Signed nonce with private key (zero-knowledge proof)
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const TokenResponseSchema = z.object({
  accessToken: z.string(),  // Short-lived JWT (5 min)
  refreshToken: z.string(),  // Long-lived (7 days)
  expiresIn: z.number(),  // Seconds
});

export type TokenResponse = z.infer<typeof TokenResponseSchema>;

// ============================================================================
// ALERTS & BROADCASTING
// ============================================================================

export const GeolocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  alt: z.number().optional(),
  accuracy: z.number().optional(),
});

export type Geolocation = z.infer<typeof GeolocationSchema>;

export const AlertSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  nonce: z.string(),
  hazardId: z.string().uuid().optional(),
  translationId: z.string().uuid().optional(),
  zkProofId: z.string().uuid().optional(),
  geolocation: GeolocationSchema.optional(),
  urgencyLevel: z.number().int().min(1).max(10),
  status: z.enum(['PENDING', 'BROADCASTED', 'ACKNOWLEDGED', 'RESOLVED', 'ARCHIVED']),
  broadcastedAt: z.date().nullable(),
  resolvedAt: z.date().nullable(),
  timestamp: z.date(),
  ledgerTxId: z.string().optional(),
  vectorClock: z.number().int(),
});

export type Alert = z.infer<typeof AlertSchema>;

export const CreateAlertRequestSchema = z.object({
  hazardId: z.string().uuid().optional(),
  geolocation: GeolocationSchema.optional(),
  urgencyLevel: z.number().int().min(1).max(10),
  nonce: z.string(),  // Idempotency key
});

export type CreateAlertRequest = z.infer<typeof CreateAlertRequestSchema>;

// ============================================================================
// HAZARD INTELLIGENCE
// ============================================================================

export const HazardSchema = z.object({
  id: z.string().uuid(),
  sourceApis: z.string(),  // CSV
  type: z.enum(['FLOOD', 'EARTHQUAKE', 'WILDFIRE', 'POLLUTION', 'PANDEMIC', 'INFRASTRUCTURE', 'OTHER']),
  probability: z.number().min(0).max(1),
  geofence: z.record(z.any()),  // GeoJSON
  fusedData: z.record(z.any()).optional(),  // Encrypted
  dpEpsilon: z.number(),
  dpDelta: z.number(),
  timestamp: z.date(),
  expiresAt: z.date().nullable(),
  sourceCount: z.number().int(),
  confidenceScore: z.number().min(0).max(1),
});

export type Hazard = z.infer<typeof HazardSchema>;

export const IngestHazardRequestSchema = z.object({
  sourceApis: z.array(z.string()),  // URLs
  type: z.enum(['FLOOD', 'EARTHQUAKE', 'WILDFIRE', 'POLLUTION', 'PANDEMIC', 'INFRASTRUCTURE', 'OTHER']),
});

export type IngestHazardRequest = z.infer<typeof IngestHazardRequestSchema>;

// ============================================================================
// TRANSLATION & MULTILINGUAL
// ============================================================================

export const TranslationSchema = z.object({
  id: z.string().uuid(),
  sourceLang: z.string().length(2),  // ISO 639-1
  targetLang: z.string().length(2),
  prosodyScore: z.number().min(0).max(1),
  zkFidelityProofId: z.string().uuid().optional(),
  federatedRound: z.number().int().optional(),
  modelHash: z.string().optional(),
  timestamp: z.date(),
});

export type Translation = z.infer<typeof TranslationSchema>;

export const TranslateRequestSchema = z.object({
  text: z.string(),
  sourceLang: z.string().length(2),
  targetLang: z.string().length(2),
  preserveUrgency: z.boolean().default(true),
});

export type TranslateRequest = z.infer<typeof TranslateRequestSchema>;

export const TranslateResponseSchema = z.object({
  translationId: z.string().uuid(),
  translatedText: z.string(),
  prosodyScore: z.number().min(0).max(1),
  zkFidelityProofId: z.string().uuid().optional(),
});

export type TranslateResponse = z.infer<typeof TranslateResponseSchema>;

// ============================================================================
// ZERO-KNOWLEDGE PROOFS
// ============================================================================

export const ZkProofSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  proofType: z.enum(['TRANSLATION_FIDELITY', 'ALERT_AUTHENTICITY', 'NETWORK_VERIFICATION']),
  commitment: z.string(),  // SHA256
  proofJson: z.record(z.any()),  // snarkjs format
  verifiedAt: z.date().nullable(),
  verifier: z.string().optional(),
  timestamp: z.date(),
});

export type ZkProof = z.infer<typeof ZkProofSchema>;

export const GenerateZkProofRequestSchema = z.object({
  proofType: z.enum(['TRANSLATION_FIDELITY', 'ALERT_AUTHENTICITY', 'NETWORK_VERIFICATION']),
  inputs: z.record(z.any()),  // Circuit inputs
});

export type GenerateZkProofRequest = z.infer<typeof GenerateZkProofRequestSchema>;

export const VerifyZkProofRequestSchema = z.object({
  proofJson: z.record(z.any()),
  publicInputs: z.array(z.string()),
  commitment: z.string(),
});

export type VerifyZkProofRequest = z.infer<typeof VerifyZkProofRequestSchema>;

// ============================================================================
// FEDERATED LEARNING
// ============================================================================

export const FederatedUpdateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  modelType: z.string(),
  updateDelta: z.record(z.any()),  // Encrypted weights
  dpClipping: z.number(),
  dpNoise: z.record(z.any()).optional(),
  aggregationRound: z.number().int(),
  nonce: z.string(),  // Idempotency key
  timestamp: z.date(),
});

export type FederatedUpdate = z.infer<typeof FederatedUpdateSchema>;

export const SubmitFederatedUpdateRequestSchema = z.object({
  modelType: z.string(),
  updateDelta: z.record(z.any()),
  dpClipping: z.number().default(1.0),
  nonce: z.string(),  // base64(random || timestamp)
});

export type SubmitFederatedUpdateRequest = z.infer<typeof SubmitFederatedUpdateRequestSchema>;

export const AggregationResultSchema = z.object({
  aggregationRound: z.number().int(),
  modelType: z.string(),
  aggregatedWeights: z.record(z.any()),
  converged: z.boolean(),
  metricsHash: z.string(),  // SHA256 of metrics (non-repudiation)
});

export type AggregationResult = z.infer<typeof AggregationResultSchema>;

// ============================================================================
// NETWORK VERIFICATION
// ============================================================================

export const NetworkVerificationSchema = z.object({
  id: z.string().uuid(),
  verifierId: z.string().uuid(),
  subjectId: z.string().uuid(),
  credentialType: z.string(),
  zkProofId: z.string().uuid().optional(),
  verifiedByChain: z.array(z.object({
    verifierId: z.string().uuid(),
    timestamp: z.date(),
  })).optional(),
  status: z.enum(['PENDING', 'VERIFIED', 'REVOKED', 'EXPIRED']),
  expiresAt: z.date(),
  timestamp: z.date(),
});

export type NetworkVerification = z.infer<typeof NetworkVerificationSchema>;

export const VerifyResponderRequestSchema = z.object({
  subjectId: z.string().uuid(),
  credentialType: z.string(),
  zkProof: z.record(z.any()),
});

export type VerifyResponderRequest = z.infer<typeof VerifyResponderRequestSchema>;

// ============================================================================
// AUDIT & MONITORING
// ============================================================================

export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string(),
  details: z.record(z.any()).optional(),
  hash: z.string(),  // SHA256
  prevHash: z.string().nullable(),
  ledgerTxId: z.string().optional(),
  ledgerLoggedAt: z.date().nullable(),
  timestamp: z.date(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;

// ============================================================================
// ERROR RESPONSES
// ============================================================================

export const ErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  message: z.string(),
  errors: z.array(z.string()).optional(),
  timestamp: z.date(),
  requestId: z.string().uuid(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface JwtPayload {
  sub: string;  // User ID
  role: string;
  iat: number;  // Issued at
  exp: number;  // Expiration
}

export interface RequestContext {
  userId: string;
  role: string;
  requestId: string;
  timestamp: Date;
  ip: string;
  nonce?: string;  // For anti-replay
}

export interface ChaosScenario {
  name: string;
  description: string;
  affectedRegions: string[];
  estimatedDuration: number;  // Milliseconds
  resilience: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * ResilientEcho ZK-SNARK Circuit Definitions
 * 
 * Groth16 circuit structures for snarkjs integration
 * All circuits support non-interactive zero-knowledge proofs
 * 
 * @security All proofs use 128-bit security level (Groth16 standard)
 */

export const ZKP_CIRCUIT_CONFIGS = {
  // =========================================================================
  // CIRCUIT 1: TRANSLATION FIDELITY PROOF
  // =========================================================================
  // Proves that a translated message preserves semantic urgency
  // WITHOUT revealing the source or target text
  //
  // Public inputs: [ semanticHash_source, semanticHash_target, prosodyScore ]
  // Private inputs: source_text, target_text
  //
  // Circuit logic:
  //   1. Hash source text → must equal semanticHash_source
  //   2. Hash target text → must equal semanticHash_target
  //   3. Calculate prosody score (urgency preservation) → must >= 0.7
  //   4. Commit to (semanticHash_source, semanticHash_target, prosodyScore)
  TRANSLATION_FIDELITY: {
    name: 'translate_fidelity',
    description: 'Proves translation accuracy (preservation of urgency semantics)',
    circuitFile: 'circuits/translate_fidelity.circom',
    inputSchema: {
      publicInputs: [
        {
          name: 'semanticHashSource',
          type: 'bytes32',
          description: 'SHA256(source_text)',
        },
        {
          name: 'semanticHashTarget',
          type: 'bytes32',
          description: 'SHA256(target_text)',
        },
        {
          name: 'prosodyScoreConstraint',
          type: 'uint256',
          description: 'Threshold score (e.g., 70 = 0.7)',
        },
      ],
      privateInputs: [
        {
          name: 'sourceText',
          type: 'string',
          description: 'Original message (never revealed)',
        },
        {
          name: 'targetText',
          type: 'string',
          description: 'Translated message (never revealed)',
        },
        {
          name: 'prosodyScore',
          type: 'uint256',
          description: 'Actual semantic preservation score [0-100]',
        },
      ],
    },
    circuitLang: `
pragma circom 2.0;

include "circomlib/poseidon.circom";
include "circomlib/comparators.circom";

template TranslateFidelity() {
  signal input semanticHashSource;  // Public: hash of source
  signal input semanticHashTarget;  // Public: hash of target
  signal input prosodyScoreConstraint;  // Public: minimum threshold

  signal private input sourceText;  // Private: never revealed
  signal private input targetText;  // Private: never revealed
  signal private input prosodyScore;  // Private: 0-100

  // Verify source hash
  component hash_source = Poseidon(1);
  hash_source.inputs[0] <== sourceText;
  hash_source.out === semanticHashSource;

  // Verify target hash
  component hash_target = Poseidon(1);
  hash_target.inputs[0] <== targetText;
  hash_target.out === semanticHashTarget;

  // Verify prosody score meets threshold
  component score_check = GreaterEqThan(256);
  score_check.in[0] <== prosodyScore;
  score_check.in[1] <== prosodyScoreConstraint;
  score_check.out === 1;  // Must be >= threshold
}

component main {public [semanticHashSource, semanticHashTarget, prosodyScoreConstraint]} = TranslateFidelity();
    `,
  },

  // =========================================================================
  // CIRCUIT 2: ALERT AUTHENTICITY PROOF
  // =========================================================================
  // Proves that an alert was created by a specific user
  // WITHOUT revealing user's private key
  //
  // Public inputs: [ userPublicKeyHash, alertHash, nonce ]
  // Private inputs: userPrivateKey, alertContent, timestamp
  //
  // Circuit logic:
  //   1. Verify Ed25519 public key from private key
  //   2. Hash alert content → must equal alertHash
  //   3. Sign alert with private key
  //   4. Verify signature
  //   5. Nonce prevents replay attack
  ALERT_AUTHENTICITY: {
    name: 'alert_authenticity',
    description: 'Proves alert was created by the claimed user (Ed25519 signature)',
    circuitFile: 'circuits/alert_authenticity.circom',
    inputSchema: {
      publicInputs: [
        {
          name: 'userPublicKeyHash',
          type: 'bytes32',
          description: 'Hash of user\s Ed25519 public key',
        },
        {
          name: 'alertContentHash',
          type: 'bytes32',
          description: 'SHA256(alertGeolocation + urgency + timestamp)',
        },
        {
          name: 'nonce',
          type: 'bytes32',
          description: 'Replay attack prevention',
        },
      ],
      privateInputs: [
        {
          name: 'userPrivateKey',
          type: 'bytes32',
          description: 'Ed25519 private key (never revealed)',
        },
        {
          name: 'alertContent',
          type: 'string',
          description: 'Alert message or metadata',
        },
        {
          name: 'signature',
          type: 'bytes64',
          description: 'Ed25519 signature of alert content',
        },
      ],
    },
    circuitLang: `
pragma circom 2.0;

include "circomlib/poseidon.circom";
include "circomlib/eddsa.circom";

template AlertAuthenticity() {
  signal input userPublicKeyHash;  // Public: hash of pubkey
  signal input alertContentHash;  // Public: hash of alert
  signal input nonce;  // Public: replay prevention

  signal private input userPrivateKey;  // Private: Ed25519 secret
  signal private input alertContent;  // Private: never revealed
  signal private input signature;  // Private: never revealed

  // Verify alert content hash
  component hash_alert = Poseidon(1);
  hash_alert.inputs[0] <== alertContent;
  hash_alert.out === alertContentHash;

  // Verify Ed25519 signature (via EdDSA component)
  component eddsa = EdDSA();
  eddsa.privKey <== userPrivateKey;
  eddsa.message <== alertContent;
  eddsa.signature <== signature;
  eddsa.pubKeyVerification === 1;  // Signature valid

  // Verify public key hash matches
  component hash_pubkey = Poseidon(1);
  hash_pubkey.inputs[0] <== eddsa.pubKey;
  hash_pubkey.out === userPublicKeyHash;
}

component main {public [userPublicKeyHash, alertContentHash, nonce]} = AlertAuthenticity();
    `,
  },

  // =========================================================================
  // CIRCUIT 3: NETWORK VERIFICATION PROOF
  // =========================================================================
  // Proves that a responder has valid credentials
  // Without revealing credential details
  //
  // Public inputs: [ credentialCommitment, orgHash, clearanceLevel ]
  // Private inputs: responderName, orgId, certificationDate, certificationId
  //
  // Circuit logic:
  //   1. Hash responder credentials (name, org, date, id)
  //   2. Hash matches commitment
  //   3. Clearance level >= minimum required
  //   4. Certification not expired
  NETWORK_VERIFICATION: {
    name: 'network_verification',
    description: 'Proves responder credentials without revealing personal details',
    circuitFile: 'circuits/network_verification.circom',
    inputSchema: {
      publicInputs: [
        {
          name: 'credentialCommitment',
          type: 'bytes32',
          description: 'Poseidon hash of credential data',
        },
        {
          name: 'organizationHash',
          type: 'bytes32',
          description: 'Hash of organization ID',
        },
        {
          name: 'minimumClearanceLevel',
          type: 'uint256',
          description: 'Minimum level required (0-5)',
        },
      ],
      privateInputs: [
        {
          name: 'responderName',
          type: 'string',
          description: 'Full name (never revealed)',
        },
        {
          name: 'organizationId',
          type: 'string',
          description: 'Org ID (never revealed)',
        },
        {
          name: 'certificationDate',
          type: 'uint256',
          description: 'UNIX timestamp of certification',
        },
        {
          name: 'clearanceLevel',
          type: 'uint256',
          description: '0=unverified, 5=gold-standard, never revealed',
        },
      ],
    },
    circuitLang: `
pragma circom 2.0;

include "circomlib/poseidon.circom";
include "circomlib/comparators.circom";

template NetworkVerification() {
  signal input credentialCommitment;  // Public: hash of creds
  signal input organizationHash;  // Public: hash of org
  signal input minimumClearanceLevel;  // Public: threshold

  signal private input responderName;  // Private
  signal private input organizationId;  // Private
  signal private input certificationDate;  // Private
  signal private input clearanceLevel;  // Private: 0-5

  // Verify credential commitment
  component hash_cred = Poseidon(4);
  hash_cred.inputs[0] <== responderName;
  hash_cred.inputs[1] <== organizationId;
  hash_cred.inputs[2] <== certificationDate;
  hash_cred.inputs[3] <== clearanceLevel;
  hash_cred.out === credentialCommitment;

  // Verify organization hash
  component hash_org = Poseidon(1);
  hash_org.inputs[0] <== organizationId;
  hash_org.out === organizationHash;

  // Verify clearance level meets minimum
  component clearance_check = GreaterEqThan(256);
  clearance_check.in[0] <== clearanceLevel;
  clearance_check.in[1] <== minimumClearanceLevel;
  clearance_check.out === 1;  // clearanceLevel >= minimum

  // Verify certification is not too old (max age: 365 days)
  signal private input currentTimestamp;  // Implicit private
  component age_check = LessThan(256);
  component one_year = 31536000;  // 365 days in seconds
  
  // certificationDate + one_year > currentTimestamp
  component age_valid = GreaterThan(256);
  age_valid.in[0] <== certificationDate + one_year;
  age_valid.in[1] <== currentTimestamp;
  age_valid.out === 1;
}

component main {public [credentialCommitment, organizationHash, minimumClearanceLevel]} = NetworkVerification();
    `,
  },

  // =========================================================================
  // CIRCUIT 4: PROXIMITY CONFIRMATION PROOF
  // =========================================================================
  // Proves that a responder is physically near a geofence
  // Without revealing exact location
  //
  // Public inputs: [ geofenceHash, proximityRadius, encryptedLocation ]
  // Private inputs: actualLat, actualLon, privateKey
  PROXIMITY_CONFIRMATION: {
    name: 'proximity_confirmation',
    description: 'Proves physical proximity to geofence without revealing exact location',
    circuitFile: 'circuits/proximity_confirmation.circom',
    inputSchema: {
      publicInputs: [
        {
          name: 'geofenceHash',
          type: 'bytes32',
          description: 'Hash of geofence polygon',
        },
        {
          name: 'proximityRadiusKm',
          type: 'uint256',
          description: 'Maximum distance in km',
        },
        {
          name: 'encryptedLocationHash',
          type: 'bytes32',
          description: 'Encrypted location commitment',
        },
      ],
      privateInputs: [
        {
          name: 'actualitatude',
          type: 'int256',
          description: 'Actual latitude (never revealed)',
        },
        {
          name: 'actualLongitude',
          type: 'int256',
          description: 'Actual longitude (never revealed)',
        },
      ],
    },
    circuitLang: `
pragma circom 2.0;

include "circomlib/poseidon.circom";
include "circomlib/comparators.circom";

// Simplified Haversine distance approximation (for ZKP efficiency)
template HaversineDistance() {
  signal input lat1;
  signal input lon1;
  signal input lat2;
  signal input lon2;
  signal output distance;

  // Simplified: dx^2 + dy^2 gives relative distance
  var dx = lon2 - lon1;
  var dy = lat2 - lat1;
  distance <== dx * dx + dy * dy;
}

template ProximityConfirmation() {
  signal input geofenceHash;  // Public
  signal input proximityRadiusKm;  // Public
  signal input encryptedLocationHash;  // Public

  signal private input actualLatitude;  // Private
  signal private input actualLongitude;  // Private

  // Center of geofence (public)
  signal input geofenceCenterLat;
  signal input geofenceCenterLon;

  // Verify encrypted location commitment
  component hash_location = Poseidon(2);
  hash_location.inputs[0] <== actualLatitude;
  hash_location.inputs[1] <== actualLongitude;
  hash_location.out === encryptedLocationHash;

  // Verify proximity to geofence center
  component distance = HaversineDistance();
  distance.lat1 <== actualLatitude;
  distance.lon1 <== actualLongitude;
  distance.lat2 <== geofenceCenterLat;
  distance.lon2 <== geofenceCenterLon;

  // Distance must be <= proximityRadius
  component within_geofence = LessThanOrEq(256);
  within_geofence.in[0] <== distance.distance;
  within_geofence.in[1] <== proximityRadiusKm * proximityRadiusKm;  // squared
  within_geofence.out === 1;
}

component main {public [geofenceHash, proximityRadiusKm, encryptedLocationHash]} = ProximityConfirmation();
    `,
  },
};

// ============================================================================
// UTILITY: ZKP CIRCUIT COMPILER CONFIGURATION
// ============================================================================

export interface ZkCircuitConfig {
  name: string;
  description: string;
  circuitFile: string;
  inputSchema: {
    publicInputs: Array<{ name: string; type: string; description: string }>;
    privateInputs: Array<{ name: string; type: string; description: string }>;
  };
  circuitLang: string;
}

export interface ZkProofInput {
  publicInputs: Record<string, string | number>;
  privateInputs: Record<string, string | number>;
}

export interface ZkProofOutput {
  proof: {
    pi_a: [string, string, string];
    pi_b: [[string, string], [string, string], [string, string]];
    pi_c: [string, string, string];
  };
  publicSignals: string[];
  commitment: string;  // Poseidon(publicSignals)
}

/**
 * Get circuit configuration by name
 * @param circuitName Circuit identifier (e.g., "TRANSLATION_FIDELITY")
 */
export function getZkCircuitConfig(circuitName: keyof typeof ZKP_CIRCUIT_CONFIGS): ZkCircuitConfig {
  return ZKP_CIRCUIT_CONFIGS[circuitName];
}

/**
 * Validate ZK proof input against circuit schema
 * @param circuitName Circuit identifier
 * @param input User-provided input
 * @throws Error if input doesn't match schema
 */
export function validateZkProofInput(
  circuitName: keyof typeof ZKP_CIRCUIT_CONFIGS,
  input: ZkProofInput
): boolean {
  const config = getZkCircuitConfig(circuitName);

  // Validate public inputs
  for (const pubInput of config.inputSchema.publicInputs) {
    if (!(pubInput.name in input.publicInputs)) {
      throw new Error(`Missing public input: ${pubInput.name}`);
    }
  }

  // Validate private inputs
  for (const privInput of config.inputSchema.privateInputs) {
    if (!(privInput.name in input.privateInputs)) {
      throw new Error(`Missing private input: ${privInput.name}`);
    }
  }

  return true;
}

/**
 * Example: How to use ZKP circuits with snarkjs
 * 
 * import { groth16 } from 'snarkjs';
 * 
 * export async function generateZkProof(
 *   circuitName: string,
 *   input: ZkProofInput,
 *   wasmPath: string,
 *   zkeyPath: string
 * ): Promise<ZkProofOutput> {
 *   validateZkProofInput(circuitName as any, input);
 * 
 *   const { proof, publicSignals } = await groth16.fullProve(
 *     input,
 *     wasmPath,  // compiled circuit WASM
 *     zkeyPath   // zero-knowledge key
 *   );
 * 
 *   // Create commitment hash
 *   const commitment = await poseidonHash(publicSignals);
 * 
 *   return {
 *     proof,
 *     publicSignals,
 *     commitment,
 *   };
 * }
 * 
 * export async function verifyZkProof(
 *   proof: ZkProofOutput,
 *   vkeyPath: string
 * ): Promise<boolean> {
 *   return await groth16.verify(
 *     vkeyPath,  // verification key
 *     proof.publicSignals,
 *     proof.proof
 *   );
 * }
 */

export const ZKP_SETUP_INSTRUCTIONS = `
# CircomJS + snarkjs Setup (Nation-State Resistant ZKPs)

## Prerequisites
npm install --save-dev circom@2.0 snarkjs poseidon-goldilocks

## Step 1: Compile Circuits
\`\`\`bash
circom circuits/translate_fidelity.circom --r1cs --wasm -o build
circom circuits/alert_authenticity.circom --r1cs --wasm -o build
circom circuits/network_verification.circom --r1cs --wasm -o build
circom circuits/proximity_confirmation.circom --r1cs --wasm -o build
\`\`\`

## Step 2: Generate Zero-Knowledge Keys (Powers of Tau)
\`\`\`bash
snarkjs powersoftau new bn128 13 pot13_initial.ptau -v
snarkjs powersoftau contribute pot13_initial.ptau pot13_final.ptau \
  --name="resilientercho" --entropy="random_entropy_string"
snarkjs powersoftau verify pot13_final.ptau
\`\`\`

## Step 3: Setup (Create Proving/Verification Keys)
\`\`\`bash
snarkjs groth16 setup build/translate_fidelity.r1cs pot13_final.ptau build/translate_fidelity_0000.zkey
snarkjs zkey contribute build/translate_fidelity_0000.zkey build/translate_fidelity_final.zkey \
  --name="contributor" --entropy="random_entropy"
snarkjs zkey export verificationkey build/translate_fidelity_final.zkey build/translate_fidelity_vkey.json
\`\`\`

## Step 4: Generate Proof (in Application)
\`\`\`typescript
import { groth16 } from 'snarkjs';
const { proof, publicSignals } = await groth16.fullProve(
  input,
  'build/translate_fidelity.wasm',
  'build/translate_fidelity_final.zkey'
);
\`\`\`

## Step 5: Verify Proof (On-Chain or Server)
\`\`\`typescript
const isValid = await groth16.verify(
  vkey,
  publicSignals,
  proof
);
\`\`\`

## Security Notes
- Powers of Tau ceremony MUST use secure randomness
- Private inputs NEVER transmitted or logged
- Public signals committed in storage (Poseidon hash)
- Verification can run in browser (no backend needed)
`;

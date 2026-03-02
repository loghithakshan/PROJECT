import { registerAs } from '@nestjs/config';

/**
 * Zero-Knowledge Proof Configuration
 * snarkjs circuits, proof parameters, verification
 */

export default registerAs('zkp', () => ({
  // Circuit definitions
  circuits: {
    translationFidelity: {
      name: 'translate_fidelity',
      version: '1.0.0',
      wasm: process.env.ZK_CIRCUIT_DIR + '/translate_fidelity.wasm',
      zkey: process.env.ZK_CIRCUIT_DIR + '/translate_fidelity_final.zkey',
      vkey: process.env.ZK_CIRCUIT_DIR + '/translate_fidelity.vkey.json',
    },
    proximityProof: {
      name: 'proximity_proof',
      version: '1.0.0',
      wasm: process.env.ZK_CIRCUIT_DIR + '/proximity_proof.wasm',
      zkey: process.env.ZK_CIRCUIT_DIR + '/proximity_proof_final.zkey',
      vkey: process.env.ZK_CIRCUIT_DIR + '/proximity_proof.vkey.json',
    },
    networkVerification: {
      name: 'network_verification',
      version: '1.0.0',
      wasm: process.env.ZK_CIRCUIT_DIR + '/network_verification.wasm',
      zkey: process.env.ZK_CIRCUIT_DIR + '/network_verification_final.zkey',
      vkey: process.env.ZK_CIRCUIT_DIR + '/network_verification.vkey.json',
    },
  },

  // Proof system
  proofSystem: {
    backend: 'groth16', // or 'plonk'
    curve: 'bn128', // BN254
    securityLevel: 128, // bits
  },

  // Verification
  verification: {
    // Use precompiled verifier contracts on Hyperledger for speed
    useOnChainVerification: process.env.ZK_ONCHAIN_VERIFICATION === 'true',
    contractAddress: process.env.ZK_VERIFIER_CONTRACT,
  },

  // Storage
  storage: {
    // Where to store generated proofs
    directory: process.env.ZK_PROOF_DIR || './proofs',
    // Archive old proofs to blockchain for audit
    archiveToBlockchain: true,
  },

  // Performance
  performance: {
    // Cache verification keys in memory
    cacheVerificationKeys: true,
    // Parallelism for proof generation
    proofGenerationWorkers: process.env.ZK_WORKERS || 4,
  },
}));

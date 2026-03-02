import { registerAs } from '@nestjs/config';

/**
 * Blockchain Configuration
 * Hyperledger Fabric for immutable audit ledger
 * Alternative: Polygon zkEVM for government integration
 */

export default registerAs('blockchain', () => ({
  // Hyperledger Fabric
  fabric: {
    enabled: process.env.FABRIC_ENABLED !== 'false',
    
    // Network setup
    mspId: process.env.FABRIC_MSP_ID || 'ResilientEchoDev',
    channelName: process.env.FABRIC_CHANNEL || 'audit-ledger',
    chaincodeName: process.env.FABRIC_CHAINCODE || 'audit-chaincode',
    chaincodeVersion: process.env.FABRIC_CHAINCODE_VERSION || '1.0.0',

    // Connection parameters
    peerAddr: process.env.FABRIC_PEER_ADDR || 'localhost:7051',
    ordererAddr: process.env.FABRIC_ORDERER_ADDR || 'localhost:7050',
    caCert: process.env.FABRIC_CA_CERT || './certs/ca.crt',
    clientCert: process.env.FABRIC_CLIENT_CERT || './certs/client.crt',
    clientKey: process.env.FABRIC_CLIENT_KEY || './certs/client.key',

    // TLS
    tlsEnabled: process.env.FABRIC_TLS_ENABLED !== 'false',
    tlsCaCert: process.env.FABRIC_TLS_CA_CERT,

    // Timeouts
    timeouts: {
      proposal: 45000, // ms
      transaction: 120000, // ms
    },
  },

  // Polygon zkEVM (optional, for government compliance)
  polygonZkEVM: {
    enabled: process.env.POLYGON_ZKEVM_ENABLED === 'true',
    rpcUrl: process.env.POLYGON_ZKEVM_RPC || 'https://zkevm-rpc.com',
    contractAddress: process.env.POLYGON_AUDIT_CONTRACT,
    chainId: 1442, // Polygon zkEVM testnet
  },

  // Event hooks
  events: {
    // Which events to persist to blockchain
    eventsToArchive: [
      'ALERT_BROADCAST',
      'TRANSLATION_COMPLETED',
      'RESPONDER_VERIFIED',
      'ZK_PROOF_VERIFIED',
    ],
    
    // Batching for efficiency
    batchSize: 10,
    batchTimeoutMs: 60000, // 1 minute max wait
  },

  // Retry policy for blockchain writes
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
}));

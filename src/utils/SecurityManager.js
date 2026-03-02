/**
 * Advanced Encryption & Security System
 * AES-256 encryption, key rotation, hmac signing
 */

const crypto = require('crypto');

class SecurityManager {
  constructor() {
    this.algorithmAES = 'aes-256-gcm';
    this.algorithmHMAC = 'sha256';
    this.keyRotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days
    this.keys = new Map();
    this._initializeKeys();
  }

  /**
   * Initialize encryption keys
   */
  _initializeKeys() {
    const masterKey = crypto
      .createHash('sha256')
      .update(process.env.ENCRYPTION_KEY || 'default-key')
      .digest();
    
    this.keys.set('current', {
      key: masterKey,
      createdAt: Date.now()
    });
  }

  /**
   * Encrypt data with AES-256-GCM
   */
  encrypt(plaintext) {
    try {
      const iv = crypto.randomBytes(16);
      const key = this.keys.get('current').key;
      const cipher = crypto.createCipheriv(this.algorithmAES, key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      return {
        iv: iv.toString('hex'),
        encrypted,
        authTag: authTag.toString('hex'),
        algorithm: this.algorithmAES
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data with AES-256-GCM
   */
  decrypt(encryptedData) {
    try {
      const key = this.keys.get('current').key;
      const decipher = crypto.createDecipheriv(
        this.algorithmAES,
        key,
        Buffer.from(encryptedData.iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate HMAC signature
   */
  generateHMAC(data) {
    const key = this.keys.get('current').key;
    return crypto
      .createHmac(this.algorithmHMAC, key)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifyHMAC(data, signature) {
    const expected = this.generateHMAC(data);
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  }

  /**
   * Generate cryptographically secure random string
   */
  generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate cryptographically secure random token
   */
  generateToken(length = 48) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash password with salt
   */
  async hashPassword(password) {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password, hash) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate key pair for asymmetric encryption
   */
  generateKeyPair() {
    return crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
  }

  /**
   * Rotate encryption keys
   */
  rotateKeys() {
    const oldKey = this.keys.get('current');
    const newMasterKey = crypto.randomBytes(32);

    this.keys.set('old', oldKey);
    this.keys.set('current', {
      key: newMasterKey,
      createdAt: Date.now()
    });

    // Schedule cleanup of old key
    setTimeout(() => {
      this.keys.delete('old');
    }, this.keyRotationInterval);

    return { rotated: true, newKeyId: 'current' };
  }

  /**
   * Create hash for data integrity check
   */
  createHash(data, algorithm = 'sha256') {
    return crypto
      .createHash(algorithm)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify data integrity
   */
  verifyDataIntegrity(data, hash, algorithm = 'sha256') {
    const calculatedHash = this.createHash(data, algorithm);
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(calculatedHash)
    );
  }

  /**
   * Generate secure challenge for 2FA
   */
  generateChallenge(userId) {
    const challenge = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const hash = this.createHash(`${userId}${challenge}${timestamp}`);

    return {
      challenge,
      hash,
      expiresAt: timestamp + 300000 // 5 minutes
    };
  }

  /**
   * Verify challenge
   */
  verifyChallenge(userId, challenge, hash, expiresAt) {
    if (Date.now() > expiresAt) {
      return false;
    }

    const timestamp = expiresAt - 300000;
    const expectedHash = this.createHash(`${userId}${challenge}${timestamp}`);

    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(expectedHash)
    );
  }
}

module.exports = new SecurityManager();

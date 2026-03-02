const crypto = require('crypto-js');
const logger = require('./logger');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const encrypt = (text) => {
  try {
    const encrypted = crypto.AES.encrypt(text, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    logger.error('Encryption failed:', error);
    throw new Error('Encryption failed');
  }
};

const decrypt = (encryptedText) => {
  try {
    const decrypted = crypto.AES.decrypt(encryptedText, ENCRYPTION_KEY).toString(crypto.enc.Utf8);
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed:', error);
    throw new Error('Decryption failed');
  }
};

const hashPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS) || 10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hash);
};

const generateToken = (userId, role = 'user') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  );
};

const generateRefreshToken = (userId) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d' }
  );
};

const verifyToken = (token) => {
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken
};

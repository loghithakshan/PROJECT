/**
 * Advanced Authentication Controller
 * Using custom AuthenticationSystem with validation and security
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const AuthenticationSystem = require('../config/AuthenticationSystem');
const SecurityManager = require('../utils/SecurityManager');
const ValidationEngine = require('../utils/ValidationEngine');
const { ResponseFormatter } = require('../utils/RequestHandler');
const User = require('../models/User');

class AuthController {
  /**
   * Register new user with validation
   */
  static async register(req, res) {
    try {
      const { email, password, firstName, lastName, languages, phone } = req.body;

      // Validate email format
      if (!ValidationEngine.isValidEmail(email)) {
        return res.status(400).json(
          ResponseFormatter.error('Invalid email format')
        );
      }

      // Validate password strength
      const passwordValidation = ValidationEngine.isStrongPassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json(
          ResponseFormatter.error('Password does not meet security requirements')
        );
      }

      // Check if user exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json(
          ResponseFormatter.error('Email already registered')
        );
      }

      // Hash password using advanced security manager
      const hashedPassword = await SecurityManager.hashPassword(password);

      // Create user
      const user = new User({
        userId: uuidv4(),
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        languages: languages || ['en'],
        phone,
        isActive: true,
        createdAt: new Date()
      });

      await user.save();

      // Generate tokens
      const token = AuthenticationSystem.generateToken(user);
      const refreshToken = AuthenticationSystem.generateRefreshToken(user._id);

      logger.info(`User registered: ${email}`);

      return res.status(201).json(
        ResponseFormatter.success({
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            role: user.role
          },
          token,
          refreshToken
        }, 'User registered successfully')
      );
    } catch (error) {
      logger.error('Registration error:', error);
      return res.status(500).json(
        ResponseFormatter.error('Registration failed')
      );
    }
  }

  /**
   * Login with advanced validation
   */
  static async login(req, res) {
    try {
      const { email, password, deviceId } = req.body;

      // Validate input
      if (!ValidationEngine.isValidEmail(email)) {
        return res.status(400).json(
          ResponseFormatter.error('Invalid email format')
        );
      }

      // Find user
      const user = await User.findOne({
        email: email.toLowerCase(),
        isActive: true
      });

      if (!user) {
        logger.warn(`Login attempt with non-existent email: ${email}`);
        return res.status(401).json(
          ResponseFormatter.error('Invalid credentials')
        );
      }

      // Verify password
      const passwordValid = await SecurityManager.comparePassword(password, user.password);
      if (!passwordValid) {
        logger.warn(`Failed login attempt for user: ${email}`);
        return res.status(401).json(
          ResponseFormatter.error('Invalid credentials')
        );
      }

      // Generate tokens
      const token = AuthenticationSystem.generateToken(user);
      const refreshToken = AuthenticationSystem.generateRefreshToken(user._id);

      // Update last login
      user.lastLogin = new Date();
      if (deviceId) {
        user.devices = user.devices || [];
        user.devices.push({
          deviceId,
          lastSeen: new Date()
        });
      }
      await user.save();

      logger.info(`User logged in: ${email}`);

      return res.json(
        ResponseFormatter.success({
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            role: user.role
          },
          token,
          refreshToken
        }, 'Login successful')
      );
    } catch (error) {
      logger.error('Login error:', error);
      return res.status(500).json(
        ResponseFormatter.error('Login failed')
      );
    }
  }

  /**
   * Refresh token with validation
   */
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json(
          ResponseFormatter.error('Refresh token required')
        );
      }

      // Validate and refresh
      const newToken = AuthenticationSystem.refreshToken(refreshToken);

      return res.json(
        ResponseFormatter.success({ token: newToken }, 'Token refreshed')
      );
    } catch (error) {
      logger.error('Token refresh error:', error);
      return res.status(401).json(
        ResponseFormatter.error('Invalid refresh token')
      );
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.userId)
        .select('-password');

      if (!user || !user.isActive) {
        return res.status(404).json(
          ResponseFormatter.error('User not found')
        );
      }

      return res.json(
        ResponseFormatter.success(user, 'User retrieved')
      );
    } catch (error) {
      logger.error('Get user error:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to retrieve user')
      );
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      const { firstName, lastName, languages, preferences } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        {
          firstName,
          lastName,
          languages,
          preferences,
          updatedAt: new Date()
        },
        { new: true }
      ).select('-password');

      logger.info(`User profile updated: ${user.email}`);

      return res.json(
        ResponseFormatter.success(user, 'Profile updated')
      );
    } catch (error) {
      logger.error('Update profile error:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to update profile')
      );
    }
  }

  /**
   * Change password with validation
   */
  static async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;

      const user = await User.findById(req.user.userId);

      // Verify old password
      const isValid = await SecurityManager.comparePassword(oldPassword, user.password);
      if (!isValid) {
        return res.status(401).json(
          ResponseFormatter.error('Invalid current password')
        );
      }

      // Validate new password
      const passwordValidation = ValidationEngine.isStrongPassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json(
          ResponseFormatter.error('New password does not meet security requirements')
        );
      }

      // Update password
      user.password = await SecurityManager.hashPassword(newPassword);
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);

      return res.json(
        ResponseFormatter.success({}, 'Password changed successfully')
      );
    } catch (error) {
      logger.error('Change password error:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to change password')
      );
    }
  }

  /**
   * Logout with token revocation
   */
  static async logout(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (token) {
        AuthenticationSystem.revokeToken(token);
      }

      logger.info(`User logged out: ${req.user.userId}`);

      return res.json(
        ResponseFormatter.success({}, 'Logged out successfully')
      );
    } catch (error) {
      logger.error('Logout error:', error);
      return res.status(500).json(
        ResponseFormatter.error('Logout failed')
      );
    }
  }

  /**
   * Check permission
   */
  static async checkPermission(req, res) {
    try {
      const { permission } = req.body;
      const hasPermission = AuthenticationSystem.checkPermission(
        req.user,
        permission
      );

      return res.json(
        ResponseFormatter.success({
          permission,
          allowed: hasPermission
        })
      );
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json(
        ResponseFormatter.error('Failed to check permission')
      );
    }
  }
}

module.exports = AuthController;

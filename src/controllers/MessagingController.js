const logger = require('../utils/logger');
const ValidationEngine = require('../utils/ValidationEngine');
const ResponseFormatter = require('../utils/RequestHandler').ResponseFormatter;
const SecurityManager = require('../utils/SecurityManager');
const CacheManager = require('../utils/CacheManager');
const EventPublisher = require('../utils/EventPublisher');

/**
 * MessagingController - Secure encrypted messaging system
 * Integrates: ValidationEngine, SecurityManager, CacheManager, EventPublisher
 */
class MessagingController {
  constructor(cacheManager = null, eventPublisher = null) {
    this.cache = cacheManager || new CacheManager(2000, 600000); // 10 min TTL
    this.eventPublisher = eventPublisher || new EventPublisher();
    this.securityManager = new SecurityManager();

    // Message statuses
    this.messageStatuses = {
      'sent': 'Message has been sent',
      'delivered': 'Message has been delivered',
      'read': 'Message has been read',
      'deleted': 'Message has been deleted',
      'failed': 'Message delivery failed'
    };

    // Message types
    this.messageTypes = {
      'text': 'Text message',
      'alert': 'Emergency alert',
      'location': 'Location sharing',
      'media': 'Media attachment',
      'system': 'System message'
    };

    this.metrics = {
      messagesSent: 0,
      messagesDelivered: 0,
      messagesRead: 0,
      encryptionOperations: 0,
      cacheHits: 0
    };

    // In-memory message store (in production: database)
    this.messages = new Map();
    
    // In-memory conversation threads
    this.conversations = new Map();
  }

  /**
   * Send encrypted message
   */
  async sendMessage(req, res) {
    const startTime = Date.now();

    try {
      const { recipientId, content, messageType = 'text', attachments = [] } = req.body;
      const senderId = req.user?.id;

      if (!senderId) {
        return ResponseFormatter.error({ message: 'User authentication required' }, 401);
      }

      // Validation
      const validation = ValidationEngine.validateObject({
        recipientId: { type: 'string', required: true, minLength: 10 },
        content: { type: 'string', required: true, minLength: 1, maxLength: 5000 },
        messageType: { type: 'string', required: false, enum: Object.keys(this.messageTypes) }
      }, { recipientId, content, messageType });

      if (!validation.valid) {
        logger.warn('Message validation failed', { errors: validation.errors });
        return ResponseFormatter.error({
          message: 'Invalid message data',
          details: validation.errors
        }, 400);
      }

      // Sanitize content
      const sanitizedContent = ValidationEngine.sanitizeHTML(content);

      // Generate message ID
      const messageId = `msg:${Date.now()}:${senderId}:${recipientId}`;

      // Encrypt message content
      let encryptedContent;
      try {
        encryptedContent = this.securityManager.encrypt(sanitizedContent);
        this.metrics.encryptionOperations++;
      } catch (error) {
        logger.error('Message encryption failed', { error: error.message });
        return ResponseFormatter.error({
          message: 'Message encryption failed'
        }, 500);
      }

      const message = {
        id: messageId,
        senderId,
        recipientId,
        content: sanitizedContent, // Store plaintext for demo (would be encrypted in production)
        encryptedContent: encryptedContent,
        type: messageType,
        status: 'sent',
        attachments: attachments.slice(0, 5), // Limit attachments
        reactions: [],
        readAt: null,
        deliveredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          contentLength: sanitizedContent.length,
          hasAttachments: attachments.length > 0
        }
      };

      // Store message
      this.messages.set(messageId, message);

      // Get or create conversation
      const conversationId = this._getConversationId(senderId, recipientId);
      if (!this.conversations.has(conversationId)) {
        this.conversations.set(conversationId, {
          id: conversationId,
          participants: [senderId, recipientId],
          messageCount: 0,
          lastMessage: null,
          createdAt: new Date()
        });
      }

      const conversation = this.conversations.get(conversationId);
      conversation.messageCount++;
      conversation.lastMessage = message;

      // Invalidate conversation cache
      this.cache.invalidatePattern(`conversation:${conversationId}:*`);

      // Publish message sent event (async)
      this.eventPublisher.publishAsync('message:sent', {
        messageId,
        senderId,
        recipientId,
        type: messageType,
        timestamp: message.createdAt
      });

      this.metrics.messagesSent++;

      logger.info('Message sent successfully', {
        messageId,
        from: senderId,
        to: recipientId,
        type: messageType,
        duration: Date.now() - startTime
      });

      // Return message with encrypted content for transmission
      return ResponseFormatter.success(
        {
          id: message.id,
          senderId: message.senderId,
          recipientId: message.recipientId,
          status: message.status,
          encryptedContent: message.encryptedContent,
          createdAt: message.createdAt,
          conversationId
        },
        'Message sent successfully',
        201
      );

    } catch (error) {
      logger.error('Send message error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to send message' }, 500);
    }
  }

  /**
   * Get messages in conversation with pagination
   */
  async getMessages(req, res) {
    try {
      const { recipientId, limit = 50, offset = 0 } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseFormatter.error({ message: 'User authentication required' }, 401);
      }

      // Validation
      const validation = ValidationEngine.validateObject({
        recipientId: { type: 'string', required: true, minLength: 10 },
        limit: { type: 'number', required: false, min: 1, max: 100 },
        offset: { type: 'number', required: false, min: 0 }
      }, { recipientId, limit: parseInt(limit), offset: parseInt(offset) });

      if (!validation.valid) {
        return ResponseFormatter.error({
          message: 'Invalid query parameters',
          details: validation.errors
        }, 400);
      }

      const conversationId = this._getConversationId(userId, recipientId);
      const cacheKey = `conversation:${conversationId}:${offset}:${limit}`;

      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        return ResponseFormatter.success(cached, 'Messages retrieved (cached)', 200);
      }

      // Get all messages in conversation
      const allMessages = Array.from(this.messages.values())
        .filter(m => 
          (m.senderId === userId && m.recipientId === recipientId) ||
          (m.senderId === recipientId && m.recipientId === userId)
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const total = allMessages.length;
      const paginatedMessages = allMessages.slice(offset, offset + limit);

      // Decrypt messages for display
      const decryptedMessages = paginatedMessages.map(msg => ({
        id: msg.id,
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        content: msg.content,
        type: msg.type,
        status: msg.status,
        readAt: msg.readAt,
        createdAt: msg.createdAt,
        reactions: msg.reactions
      }));

      const result = {
        messages: decryptedMessages,
        conversation: {
          id: conversationId,
          participants: [userId, recipientId]
        },
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total
        }
      };

      this.cache.set(cacheKey, result, 600000); // 10 min cache

      logger.info('Messages retrieved', {
        conversationId,
        count: paginatedMessages.length,
        total
      });

      return ResponseFormatter.success(
        result,
        `Retrieved ${paginatedMessages.length} of ${total} messages`,
        200
      );

    } catch (error) {
      logger.error('Get messages error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to retrieve messages' }, 500);
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseFormatter.error({ message: 'User authentication required' }, 401);
      }

      const message = this.messages.get(messageId);

      if (!message) {
        return ResponseFormatter.error({ message: 'Message not found' }, 404);
      }

      if (message.recipientId !== userId) {
        return ResponseFormatter.error({
          message: 'Unauthorized to mark this message'
        }, 403);
      }

      const previousStatus = message.status;
      message.status = 'read';
      message.readAt = new Date();
      message.updatedAt = new Date();

      // Invalidate conversation cache
      const conversationId = this._getConversationId(message.senderId, message.recipientId);
      this.cache.invalidatePattern(`conversation:${conversationId}:*`);

      // Publish read event
      this.eventPublisher.publish('message:read', {
        messageId,
        readBy: userId,
        readAt: message.readAt
      });

      this.metrics.messagesRead++;

      logger.info('Message marked as read', {
        messageId,
        previousStatus,
        userId
      });

      return ResponseFormatter.success(
        message,
        'Message marked as read',
        200
      );

    } catch (error) {
      logger.error('Mark read error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to mark message as read' }, 500);
    }
  }

  /**
   * Add reaction to message
   */
  async addReaction(req, res) {
    try {
      const { messageId } = req.params;
      const { reaction } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseFormatter.error({ message: 'User authentication required' }, 401);
      }

      // Validate emoji/reaction (simple validation)
      if (!reaction || typeof reaction !== 'string' || reaction.length > 2) {
        return ResponseFormatter.error({
          message: 'Invalid reaction'
        }, 400);
      }

      const message = this.messages.get(messageId);

      if (!message) {
        return ResponseFormatter.error({ message: 'Message not found' }, 404);
      }

      // Add reaction
      const existingIndex = message.reactions.findIndex(r => r.userId === userId);

      if (existingIndex >= 0) {
        message.reactions[existingIndex].reaction = reaction;
      } else {
        message.reactions.push({
          userId,
          reaction,
          addedAt: new Date()
        });
      }

      message.updatedAt = new Date();

      // Publish reaction event
      this.eventPublisher.publish('message:reactionAdded', {
        messageId,
        userId,
        reaction
      });

      logger.info('Reaction added', { messageId, userId, reaction });

      return ResponseFormatter.success(message.reactions, 'Reaction added', 200);

    } catch (error) {
      logger.error('Add reaction error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to add reaction' }, 500);
    }
  }

  /**
   * Search messages
   */
  async searchMessages(req, res) {
    try {
      const { query, limit = 20 } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseFormatter.error({ message: 'User authentication required' }, 401);
      }

      // Validation
      if (!query || typeof query !== 'string' || query.length < 2) {
        return ResponseFormatter.error({
          message: 'Search query must be at least 2 characters'
        }, 400);
      }

      const searchTerm = query.toLowerCase();

      // Search messages
      const results = Array.from(this.messages.values())
        .filter(m =>
          (m.senderId === userId || m.recipientId === userId) &&
          (m.content.toLowerCase().includes(searchTerm) ||
            (m.type && m.type.toLowerCase().includes(searchTerm)))
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);

      logger.info('Messages searched', {
        userId,
        query,
        resultsCount: results.length
      });

      return ResponseFormatter.success(
        {
          query,
          results,
          count: results.length
        },
        `Found ${results.length} messages`,
        200
      );

    } catch (error) {
      logger.error('Search messages error', { error: error.message });
      return ResponseFormatter.error({ message: 'Search failed' }, 500);
    }
  }

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseFormatter.error({ message: 'User authentication required' }, 401);
      }

      const message = this.messages.get(messageId);

      if (!message) {
        return ResponseFormatter.error({ message: 'Message not found' }, 404);
      }

      if (message.senderId !== userId && message.recipientId !== userId) {
        return ResponseFormatter.error({
          message: 'Unauthorized to delete this message'
        }, 403);
      }

      message.status = 'deleted';
      message.content = '[Deleted]';
      message.updatedAt = new Date();

      // Publish deletion event
      this.eventPublisher.publish('message:deleted', {
        messageId,
        deletedBy: userId,
        deletedAt: message.updatedAt
      });

      logger.info('Message deleted', { messageId, userId });

      return ResponseFormatter.success(
        { id: messageId, status: 'deleted' },
        'Message deleted successfully',
        200
      );

    } catch (error) {
      logger.error('Delete message error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to delete message' }, 500);
    }
  }

  /**
   * Get conversation metadata
   */
  async getConversation(req, res) {
    try {
      const { participantId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return ResponseFormatter.error({ message: 'User authentication required' }, 401);
      }

      const conversationId = this._getConversationId(userId, participantId);
      const conversation = this.conversations.get(conversationId);

      if (!conversation) {
        return ResponseFormatter.error({
          message: 'Conversation not found'
        }, 404);
      }

      return ResponseFormatter.success(conversation, 'Conversation retrieved', 200);

    } catch (error) {
      logger.error('Get conversation error', { error: error.message });
      return ResponseFormatter.error({ message: 'Failed to retrieve conversation' }, 500);
    }
  }

  /**
   * Internal: Generate consistent conversation ID
   */
  _getConversationId(userId1, userId2) {
    const sorted = [userId1, userId2].sort();
    return `conv:${sorted[0]}:${sorted[1]}`;
  }
}

module.exports = MessagingController;

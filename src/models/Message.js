const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    unique: true,
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: String,
    required: true
  },
  content: String,
  encryptedContent: String,
  contentType: {
    type: String,
    enum: ['text', 'image', 'location', 'audio', 'media'],
    default: 'text'
  },
  attachments: [{
    type: String,
    url: String,
    mimeType: String
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isEdited: Boolean,
  editedAt: Date,
  isEncrypted: {
    type: Boolean,
    default: true
  },
  encryptionKey: String,
  messageStatus: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'deleted'],
    default: 'sent'
  },
  reactions: [{
    userId: mongoose.Schema.Types.ObjectId,
    emoji: String,
    timestamp: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date
});

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, recipientId: 1 });

module.exports = mongoose.model('Message', messageSchema);

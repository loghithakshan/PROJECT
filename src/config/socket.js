const logger = require('../utils/logger');

const initializeRealtimeEvents = (io) => {
  const users = new Map(); // Track connected users

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // User join with authentication
    socket.on('user:join', (data) => {
      const { userId, location } = data;
      users.set(socket.id, { userId, location, socketId: socket.id });
      
      // Broadcast user status
      io.emit('user:online', { userId, location });
    });

    // Real-time alert broadcast
    socket.on('alert:create', (alertData) => {
      io.emit('alert:new', {
        ...alertData,
        timestamp: new Date().toISOString()
      });
      logger.info(`Alert created: ${alertData.type}`);
    });

    // Location update for responders
    socket.on('location:update', (data) => {
      const { userId, location } = data;
      const user = [...users.values()].find(u => u.userId === userId);
      if (user) {
        user.location = location;
        io.emit('responder:location', { userId, location });
      }
    });

    // Real-time messaging
    socket.on('message:send', (messageData) => {
      const { recipientId, content, messageId } = messageData;
      io.to(`user:${recipientId}`).emit('message:receive', {
        messageId,
        senderId: messageData.senderId,
        content,
        timestamp: new Date().toISOString()
      });
    });

    // Emergency SOS signal
    socket.on('sos:trigger', (sosData) => {
      io.emit('sos:alert', {
        ...sosData,
        timestamp: new Date().toISOString(),
        priority: 'critical'
      });
      logger.warn(`SOS received from user: ${sosData.userId}`);
    });

    // Hazard detection updates
    socket.on('hazard:detected', (hazardData) => {
      io.emit('hazard:notification', {
        ...hazardData,
        timestamp: new Date().toISOString()
      });
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      socket.broadcast.emit('typing:indicator', {
        userId: data.userId,
        chatId: data.chatId
      });
    });

    socket.on('typing:stop', (data) => {
      socket.broadcast.emit('typing:stop', {
        userId: data.userId,
        chatId: data.chatId
      });
    });

    // User disconnect
    socket.on('disconnect', () => {
      const user = users.get(socket.id);
      if (user) {
        users.delete(socket.id);
        io.emit('user:offline', { userId: user.userId });
        logger.info(`User disconnected: ${socket.id}`);
      }
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  return io;
};

module.exports = initializeRealtimeEvents;

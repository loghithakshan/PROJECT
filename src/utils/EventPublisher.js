/**
 * Advanced Event Publishing System
 * Observer pattern, event queuing, async event handling
 */

class EventPublisher {
  constructor() {
    this.subscribers = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.eventQueue = [];
    this.isProcessing = false;
  }

  /**
   * Subscribe to event
   */
  subscribe(eventName, handler, priority = 0) {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, []);
    }

    const subscription = { handler, priority, id: this._generateId() };
    const handlers = this.subscribers.get(eventName);
    handlers.push(subscription);
    
    // Sort by priority (higher priority first)
    handlers.sort((a, b) => b.priority - a.priority);

    // Return unsubscribe function
    return () => {
      const index = handlers.findIndex(h => h.id === subscription.id);
      if (index > -1) handlers.splice(index, 1);
    };
  }

  /**
   * Publish event synchronously
   */
  publish(eventName, data) {
    const event = {
      name: eventName,
      data,
      timestamp: Date.now(),
      id: this._generateId()
    };

    this._recordEvent(event);

    if (!this.subscribers.has(eventName)) {
      return { eventId: event.id, handled: false };
    }

    const handlers = this.subscribers.get(eventName);
    const results = [];

    for (const { handler } of handlers) {
      try {
        const result = handler(data);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return { eventId: event.id, handled: true, results };
  }

  /**
   * Publish event asynchronously
   */
  async publishAsync(eventName, data) {
    const event = {
      name: eventName,
      data,
      timestamp: Date.now(),
      id: this._generateId(),
      async: true
    };

    this.eventQueue.push(event);
    
    if (!this.isProcessing) {
      await this._processQueue();
    }

    return event.id;
  }

  /**
   * Publish event with retry logic
   */
  async publishWithRetry(eventName, data, maxRetries = 3, delayMs = 1000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return this.publish(eventName, data);
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Process event queue
   */
  async _processQueue() {
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();

      if (!this.subscribers.has(event.name)) {
        continue;
      }

      const handlers = this.subscribers.get(event.name);

      for (const { handler } of handlers) {
        try {
          await Promise.resolve(handler(event.data));
        } catch (error) {
          console.error(`Error handling async event ${event.name}:`, error);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get event history
   */
  getEventHistory(eventName = null, limit = 100) {
    let history = this.eventHistory;

    if (eventName) {
      history = history.filter(e => e.name === eventName);
    }

    return history.slice(-limit);
  }

  /**
   * Record event in history
   */
  _recordEvent(event) {
    this.eventHistory.push(event);

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get subscriber count for event
   */
  getSubscriberCount(eventName) {
    return this.subscribers.has(eventName) 
      ? this.subscribers.get(eventName).length 
      : 0;
  }

  /**
   * Clear all subscribers
   */
  clearAllSubscribers() {
    this.subscribers.clear();
  }

  /**
   * Generate unique event ID
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new EventPublisher();

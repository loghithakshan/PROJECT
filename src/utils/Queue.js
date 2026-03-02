/**
 * Advanced Queue Management System
 * Job queue, priority queue, background tasks
 */

class Queue {
  constructor(options = {}) {
    this.name = options.name || 'Queue';
    this.jobs = [];
    this.processing = false;
    this.concurrency = options.concurrency || 1;
    this.activeJobs = 0;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 5000;
    this.metrics = {
      processed: 0,
      failed: 0,
      total: 0
    };
  }

  /**
   * Add job to queue
   */
  enqueue(job, priority = 0) {
    const queuedJob = {
      id: this._generateJobId(),
      payload: job,
      priority,
      retries: 0,
      createdAt: Date.now(),
      status: 'PENDING'
    };

    this.jobs.push(queuedJob);
    this.metrics.total++;

    // Sort by priority
    this.jobs.sort((a, b) => b.priority - a.priority);

    this._processQueue();

    return queuedJob.id;
  }

  /**
   * Process queue
   */
  async _processQueue() {
    if (this.processing || this.activeJobs >= this.concurrency) {
      return;
    }

    this.processing = true;

    while (this.jobs.length > 0 && this.activeJobs < this.concurrency) {
      const job = this.jobs.shift();
      this.activeJobs++;

      this._executeJob(job)
        .then(() => {
          this.metrics.processed++;
          this.activeJobs--;
          this._processQueue();
        })
        .catch((error) => {
          this.activeJobs--;
          this._handleJobFailure(job, error);
        });
    }

    this.processing = false;
  }

  /**
   * Execute individual job
   */
  async _executeJob(job) {
    job.status = 'PROCESSING';

    try {
      if (typeof job.payload === 'function') {
        await job.payload();
      } else if (job.payload.handler) {
        await job.payload.handler();
      }

      job.status = 'COMPLETED';
      return job;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle job failure with retry logic
   */
  async _handleJobFailure(job, error) {
    job.error = error.message;

    if (job.retries < this.maxRetries) {
      job.retries++;
      job.status = 'RETRYING';

      setTimeout(() => {
        job.status = 'PENDING';
        this.jobs.push(job);
        this._processQueue();
      }, this.retryDelay * job.retries);
    } else {
      job.status = 'FAILED';
      this.metrics.failed++;
    }
  }

  /**
   * Get queue metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      pending: this.jobs.filter(j => j.status === 'PENDING').length,
      processing: this.activeJobs,
      retrying: this.jobs.filter(j => j.status === 'RETRYING').length
    };
  }

  /**
   * Get job by ID
   */
  getJob(jobId) {
    return this.jobs.find(j => j.id === jobId);
  }

  /**
   * Clear queue
   */
  clear() {
    this.jobs = [];
  }

  /**
   * Generate job ID
   */
  _generateJobId() {
    return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Priority Queue implementation
 */
class PriorityQueue extends Queue {
  constructor(options = {}) {
    super(options);
    this.priorityLevels = {
      HIGH: 10,
      NORMAL: 5,
      LOW: 1
    };
  }

  /**
   * Enqueue with priority level
   */
  enqueueWithLevel(job, level = 'NORMAL') {
    const priority = this.priorityLevels[level] || level;
    return this.enqueue(job, priority);
  }
}

module.exports = {
  Queue,
  PriorityQueue
};

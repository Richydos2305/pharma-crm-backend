import { Queue, Job } from 'bullmq';
import { createRedisConnection } from '../../config/redis';
import { QueueNames } from '../../constants';
import { logger } from '../../helpers/logger';
import { NotFoundError, ForbiddenError } from '../../errors/CustomErrors';
import { QueueJobPayload, EnqueueJobResult, QueueJobStatus, JobStatus } from './interface';

const queue = new Queue(QueueNames.MAIN, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 1000 }
  }
});

export class QueueService {
  async enqueue(payload: QueueJobPayload): Promise<EnqueueJobResult> {
    const job = await queue.add(payload.operation, payload);
    logger.info('job_enqueued', { jobId: job.id, operation: payload.operation, userId: payload.userId });
    return {
      jobId: job.id!,
      localId: payload.localId,
      operation: payload.operation,
      status: JobStatus.QUEUED
    };
  }

  async getJobStatus(jobId: string, userId: string): Promise<QueueJobStatus> {
    const job = await Job.fromId(queue, jobId);
    if (!job) throw new NotFoundError('Job not found');
    const jobData = job.data as QueueJobPayload;
    if (jobData.userId !== userId) throw new ForbiddenError('Access denied');

    const state = (await job.getState()) as JobStatus;

    return {
      jobId: job.id!,
      localId: jobData.localId,
      operation: jobData.operation,
      status: Object.values(JobStatus).includes(state) ? state : JobStatus.WAITING,
      result: job.returnvalue ?? undefined,
      error: job.failedReason ?? undefined,
      createdAt: job.timestamp,
      completedAt: job.finishedOn ?? undefined
    };
  }
}

import { Request, Response, NextFunction } from 'express';
import { ServiceFactory } from '../factories/ServiceFactory';
import { HttpStatus } from '../constants';
import { ResponseHandlerParams } from '../interfaces/helpers';
import { QueueJobPayload } from '../services/queue/interface';

export const enqueueJob = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const queueService = ServiceFactory.createQueueService();
  const userId = res.locals.user.id as string;
  const payload: QueueJobPayload = {
    operation: req.body.operation,
    localId: req.body.localId,
    data: req.body.data,
    userId
  };
  const result = await queueService.enqueue(payload);
  return { status: HttpStatus.CREATED, message: 'Job enqueued successfully', data: result };
};

export const getJobStatus = async (req: Request, res: Response, _next: NextFunction): Promise<ResponseHandlerParams> => {
  const queueService = ServiceFactory.createQueueService();
  const userId = res.locals.user.id as string;
  const result = await queueService.getJobStatus(req.params.id, userId);
  return { status: HttpStatus.OK, message: 'Job status retrieved successfully', data: result };
};

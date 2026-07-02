import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { verifyToken } from '../middleware/auth';
import { idParamSchema, enqueueJobSchema } from '../helpers/validation';
import { enqueueJob, getJobStatus } from '../controllers/queue';

export const queueRouter = Router();

queueRouter.use(verifyToken);

queueRouter.post('/jobs', validate(enqueueJobSchema), asyncHandler(enqueueJob));
queueRouter.get('/jobs/:id', validate(idParamSchema, 'params'), asyncHandler(getJobStatus));

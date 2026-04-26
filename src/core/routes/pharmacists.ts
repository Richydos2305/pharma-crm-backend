import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { verifyToken } from '../middleware/auth';
import { idParamSchema, createPharmacistSchema, updatePharmacistSchema } from '../helpers/validation';
import { listPharmacists, getPharmacist, createPharmacist, updatePharmacist, deletePharmacist } from '../controllers/pharmacists';

export const pharmacistsRouter = Router();

pharmacistsRouter.use(verifyToken);

pharmacistsRouter.get('/', asyncHandler(listPharmacists));
pharmacistsRouter.post('/', validate(createPharmacistSchema), asyncHandler(createPharmacist));
pharmacistsRouter.get('/:id', validate(idParamSchema, 'params'), asyncHandler(getPharmacist));
pharmacistsRouter.put('/:id', validate(idParamSchema, 'params'), validate(updatePharmacistSchema), asyncHandler(updatePharmacist));
pharmacistsRouter.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(deletePharmacist));

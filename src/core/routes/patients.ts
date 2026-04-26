import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { verifyToken } from '../middleware/auth';
import { idParamSchema, createPatientSchema, updatePatientSchema } from '../helpers/validation';
import { listPatients, getPatient, createPatient, updatePatient, deletePatient } from '../controllers/patients';

export const patientsRouter = Router();

patientsRouter.use(verifyToken);

patientsRouter.get('/', asyncHandler(listPatients));
patientsRouter.post('/', validate(createPatientSchema), asyncHandler(createPatient));
patientsRouter.get('/:id', validate(idParamSchema, 'params'), asyncHandler(getPatient));
patientsRouter.put('/:id', validate(idParamSchema, 'params'), validate(updatePatientSchema), asyncHandler(updatePatient));
patientsRouter.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(deletePatient));

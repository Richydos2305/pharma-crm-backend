import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { verifyToken } from '../middleware/auth';
import { idParamSchema, createCustomFieldSchema, updateCustomFieldSchema } from '../helpers/validation';
import { listCustomFields, createCustomField, updateCustomField, deleteCustomField } from '../controllers/customFields';

export const customFieldsRouter = Router();

customFieldsRouter.use(verifyToken);

customFieldsRouter.get('/', asyncHandler(listCustomFields));
customFieldsRouter.post('/', validate(createCustomFieldSchema), asyncHandler(createCustomField));
customFieldsRouter.put('/:id', validate(idParamSchema, 'params'), validate(updateCustomFieldSchema), asyncHandler(updateCustomField));
customFieldsRouter.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(deleteCustomField));

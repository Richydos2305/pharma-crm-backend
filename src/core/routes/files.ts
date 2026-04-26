import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { verifyToken } from '../middleware/auth';
import { upload } from '../middleware/multer';
import { idParamSchema, publicIdParamSchema } from '../helpers/validation';
import { uploadFile, listFiles, deleteFile } from '../controllers/files';

export const filesRouter = Router();

filesRouter.use(verifyToken);

filesRouter.post('/upload/:patientId', validate(idParamSchema, 'params'), upload.single('file'), asyncHandler(uploadFile));
filesRouter.get('/patient/:patientId', validate(idParamSchema, 'params'), asyncHandler(listFiles));
filesRouter.delete('/:publicId', validate(publicIdParamSchema, 'params'), asyncHandler(deleteFile));

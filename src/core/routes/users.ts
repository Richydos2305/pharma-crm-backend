import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { verifyToken } from '../middleware/auth';
import { uploadImage } from '../middleware/multer';
import { updateProfileSchema } from '../helpers/validation';
import { getProfile, updateProfile, uploadLogo } from '../controllers/users';

export const usersRouter = Router();

usersRouter.use(verifyToken);

usersRouter.get('/profile', asyncHandler(getProfile));
usersRouter.put('/profile', validate(updateProfileSchema), asyncHandler(updateProfile));
usersRouter.post('/logo', uploadImage.single('file'), asyncHandler(uploadLogo));

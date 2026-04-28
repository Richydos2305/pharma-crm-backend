import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { verifyToken } from '../middleware/auth';
import { updateSettingsSchema } from '../helpers/validation';
import { getSettings, createSettings, updateSettings } from '../controllers/settings';

export const settingsRouter = Router();

settingsRouter.use(verifyToken);

settingsRouter.get('/', asyncHandler(getSettings));
settingsRouter.post('/', asyncHandler(createSettings));
settingsRouter.patch('/', validate(updateSettingsSchema), asyncHandler(updateSettings));

import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { verifyToken } from '../middleware/auth';
import { registerLimiter, loginLimiter } from '../middleware/rateLimiter';
import { registerSchema, loginSchema, refreshSchema } from '../helpers/validation';
import { register, login, refresh, logout } from '../controllers/auth';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validate(registerSchema), asyncHandler(register));
authRouter.post('/login', loginLimiter, validate(loginSchema), asyncHandler(login));
authRouter.post('/refresh', validate(refreshSchema), asyncHandler(refresh));
authRouter.post('/logout', verifyToken, validate(refreshSchema), asyncHandler(logout));

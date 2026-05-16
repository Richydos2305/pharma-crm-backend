import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { verifyToken } from '../middleware/auth';
import { registerLimiter, loginLimiter, resendVerificationLimiter, forgotPasswordLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../helpers/validation';
import { register, login, refresh, logout, verifyEmail, resendVerification, forgotPassword, resetPassword } from '../controllers/auth';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validate(registerSchema), asyncHandler(register));
authRouter.post('/login', loginLimiter, validate(loginSchema), asyncHandler(login));
authRouter.post('/refresh', validate(refreshSchema), asyncHandler(refresh));
authRouter.post('/logout', verifyToken, validate(refreshSchema), asyncHandler(logout));
authRouter.post('/verify-email', validate(verifyEmailSchema), asyncHandler(verifyEmail));
authRouter.post('/resend-verification', resendVerificationLimiter, validate(resendVerificationSchema), asyncHandler(resendVerification));
authRouter.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), asyncHandler(forgotPassword));
authRouter.post('/reset-password', validate(resetPasswordSchema), asyncHandler(resetPassword));

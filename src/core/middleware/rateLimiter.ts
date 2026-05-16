import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
export const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
export const registerLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
export const resendVerificationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3 });
export const forgotPasswordLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 3 });

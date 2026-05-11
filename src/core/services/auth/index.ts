import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserRepository } from '../../repositories/UserRepository';
import { RefreshTokenRepository } from '../../repositories/RefreshTokenRepository';
import { VerificationTokenRepository } from '../../repositories/VerificationTokenRepository';
import { EmailService } from '../email/index';
import { validateRegisterPayload, validateLoginPayload } from '../../helpers/validation';
import { sanitizeUser, generateToken, hashToken } from '../../helpers/index';
import { SecurityConfig, VerificationTokenTypes } from '../../constants';
import { settings } from '../../config/application';
import { ConflictError, UnauthorizedError, EmailNotVerifiedError, NotFoundError } from '../../errors/CustomErrors';
import { logger } from '../../helpers/logger';
import {
  LoginResult,
  RegisterResult,
  RefreshResult,
  RegisterBody,
  LoginBody,
  ResendVerificationBody,
  ForgotPasswordBody,
  ResetPasswordBody
} from './interface';

const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenRepo: RefreshTokenRepository,
    private readonly verificationTokenRepo: VerificationTokenRepository,
    private readonly emailService: EmailService
  ) {}

  private async issueTokens(userId: string, role: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = jwt.sign({ id: userId, role }, settings.jwtAccessSecret, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: userId }, settings.jwtRefreshSecret, { expiresIn: '7d', jwtid: randomUUID() });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.tokenRepo.create({
      token: refreshToken,
      userId: new Types.ObjectId(userId),
      expiresAt,
      isRevoked: false
    });
    return { accessToken, refreshToken };
  }

  async register(body: RegisterBody): Promise<RegisterResult> {
    validateRegisterPayload(body);

    const existing = await this.userRepo.findOne({ email: body.email });
    if (existing) throw new ConflictError('Account Already Exists');

    const hashedPassword = await bcrypt.hash(body.password, SecurityConfig.BCRYPT_ROUNDS);
    const user = await this.userRepo.create({ ...body, password: hashedPassword });

    const { raw, hashed } = generateToken();
    await this.verificationTokenRepo.create({
      userId: user._id,
      token: hashed,
      type: VerificationTokenTypes.EMAIL_VERIFICATION,
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS)
    });
    await this.emailService.sendVerificationEmail({ to: user.email, fullName: user.fullName, token: raw });

    logger.info('User Registered', { userId: user._id.toString(), email: user.email });
    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async login(body: LoginBody): Promise<LoginResult> {
    validateLoginPayload(body);

    const user = await this.userRepo.findOne({ email: body.email });
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const passwordsMatch = await bcrypt.compare(body.password, user.password);
    if (!passwordsMatch) throw new UnauthorizedError('Invalid credentials');

    if (!user.isEmailVerified) throw new EmailNotVerifiedError('Please verify your email before logging in');

    const tokens = await this.issueTokens(user._id.toString(), user.role);
    logger.info('User Login', { userId: user._id.toString(), email: user.email });
    return { ...tokens, user: sanitizeUser(user) };
  }

  async refresh(token: string): Promise<RefreshResult> {
    const tokenRecord = await this.tokenRepo.findOne({ token, isRevoked: false });
    if (!tokenRecord) throw new UnauthorizedError('Invalid or revoked refresh token');

    let payload: { id: string };
    try {
      payload = jwt.verify(token, settings.jwtRefreshSecret) as { id: string };
    } catch (error) {
      logger.error('Token Verification Failed', { error });
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    await this.tokenRepo.updateOne(tokenRecord._id.toString(), { isRevoked: true }, { new: true });

    const user = await this.userRepo.findOne({ _id: payload.id });
    if (!user) throw new UnauthorizedError('User not found');

    const tokens = await this.issueTokens(payload.id, user.role);
    logger.info('Token Refreshed', { userId: payload.id });
    return tokens;
  }

  async logout(token: string): Promise<void> {
    const tokenRecord = await this.tokenRepo.findOne({ token });
    if (!tokenRecord) {
      logger.warn('Logout Attempted With Unknown Token', { token: token.slice(0, 8) + '...' });
      return;
    }
    await this.tokenRepo.updateOne(tokenRecord._id.toString(), { isRevoked: true }, { new: true });
    logger.info('User Logout', { userId: tokenRecord.userId.toString() });
  }

  async verifyEmail(token: string): Promise<void> {
    const hashed = hashToken(token);
    const record = await this.verificationTokenRepo.findOne({ token: hashed, type: VerificationTokenTypes.EMAIL_VERIFICATION });
    if (!record) throw new UnauthorizedError('Invalid or expired verification token');

    if (record.expiresAt < new Date()) {
      await this.verificationTokenRepo.deleteOne({ _id: record._id });
      throw new UnauthorizedError('Verification token has expired');
    }

    await this.userRepo.updateOne(record.userId.toString(), { isEmailVerified: true }, { new: true });
    await this.verificationTokenRepo.deleteOne({ _id: record._id });
    logger.info('Email Verified', { userId: record.userId.toString() });
  }

  async resendVerification(body: ResendVerificationBody): Promise<void> {
    const user = await this.userRepo.findOne({ email: body.email });
    if (!user) return;

    if (user.isEmailVerified) throw new ConflictError('Email is already verified');

    await this.verificationTokenRepo.deleteMany({ userId: user._id, type: VerificationTokenTypes.EMAIL_VERIFICATION });

    const { raw, hashed } = generateToken();
    await this.verificationTokenRepo.create({
      userId: user._id,
      token: hashed,
      type: VerificationTokenTypes.EMAIL_VERIFICATION,
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS)
    });
    await this.emailService.sendVerificationEmail({ to: user.email, fullName: user.fullName, token: raw });
    logger.info('Verification Email Resent', { userId: user._id.toString() });
  }

  async forgotPassword(body: ForgotPasswordBody): Promise<void> {
    const user = await this.userRepo.findOne({ email: body.email });
    if (!user) return;

    await this.verificationTokenRepo.deleteMany({ userId: user._id, type: VerificationTokenTypes.PASSWORD_RESET });

    const { raw, hashed } = generateToken();
    await this.verificationTokenRepo.create({
      userId: user._id,
      token: hashed,
      type: VerificationTokenTypes.PASSWORD_RESET,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS)
    });
    await this.emailService.sendPasswordResetEmail({ to: user.email, fullName: user.fullName, token: raw });
    logger.info('Password Reset Email Sent', { userId: user._id.toString() });
  }

  async resetPassword(body: ResetPasswordBody): Promise<void> {
    const hashed = hashToken(body.token);
    const record = await this.verificationTokenRepo.findOne({ token: hashed, type: VerificationTokenTypes.PASSWORD_RESET });
    if (!record) throw new UnauthorizedError('Invalid or expired reset token');

    if (record.expiresAt < new Date()) {
      await this.verificationTokenRepo.deleteOne({ _id: record._id });
      throw new UnauthorizedError('Reset token has expired');
    }

    const user = await this.userRepo.findOne({ _id: record.userId });
    if (!user) throw new NotFoundError('User not found');

    const hashedPassword = await bcrypt.hash(body.newPassword, SecurityConfig.BCRYPT_ROUNDS);
    await this.userRepo.updateOne(user._id.toString(), { password: hashedPassword }, { new: true });
    await this.verificationTokenRepo.deleteOne({ _id: record._id });
    await this.tokenRepo.deleteMany({ userId: user._id });

    logger.info('Password Reset', { userId: user._id.toString() });
  }
}

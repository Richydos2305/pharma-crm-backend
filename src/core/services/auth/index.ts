import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserRepository } from '../../repositories/UserRepository';
import { RefreshTokenRepository } from '../../repositories/RefreshTokenRepository';
import { validateRegisterPayload, validateLoginPayload } from '../../helpers/validation';
import { sanitizeUser } from '../../helpers/index';
import { SecurityConfig } from '../../constants';
import { settings } from '../../config/application';
import { ConflictError, UnauthorizedError } from '../../errors/CustomErrors';
import { logger } from '../../helpers/logger';
import { SanitizedUser, LoginResult, RegisterResult, RefreshResult, RegisterBody, LoginBody } from './interface';

export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenRepo: RefreshTokenRepository
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
    const tokens = await this.issueTokens(user._id.toString(), user.role);
    logger.info('User Registered', { userId: user._id.toString(), email: user.email });
    return { ...tokens, user: sanitizeUser(user) };
  }

  async login(body: LoginBody): Promise<LoginResult> {
    validateLoginPayload(body);

    const user = await this.userRepo.findOne({ email: body.email });
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const passwordsMatch = await bcrypt.compare(body.password, user.password);
    if (!passwordsMatch) throw new UnauthorizedError('Invalid credentials');

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
}

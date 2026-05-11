import { Resend } from 'resend';
import { settings } from '../../config/application';
import { logger } from '../../helpers/logger';
import { SendVerificationEmailParams, SendPasswordResetEmailParams } from './interface';

export class EmailService {
  private readonly client: Resend;

  constructor() {
    this.client = new Resend(settings.resendApiKey);
  }

  async sendVerificationEmail({ to, fullName, token }: SendVerificationEmailParams): Promise<void> {
    const link = `${settings.appUrl}/verify-email?token=${token}`;
    const { error } = await this.client.emails.send({
      from: 'PharmaCRM <onboarding@resend.dev>',
      to,
      subject: 'Verify your email address',
      html: `<p>Hi ${fullName},</p>
             <p>Please verify your email address by clicking the link below. This link expires in 24 hours.</p>
             <p><a href="${link}">Verify Email</a></p>
             <p>If you did not request this, you can safely ignore this email.</p>`
    });
    if (error) {
      logger.error('Failed to send verification email', { to, error });
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail({ to, fullName, token }: SendPasswordResetEmailParams): Promise<void> {
    const link = `${settings.appUrl}/reset-password?token=${token}`;
    const { error } = await this.client.emails.send({
      from: 'PharmaCRM <onboarding@resend.dev>',
      to,
      subject: 'Reset your password',
      html: `<p>Hi ${fullName},</p>
             <p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p>
             <p><a href="${link}">Reset Password</a></p>
             <p>If you did not request this, you can safely ignore this email.</p>`
    });
    if (error) {
      logger.error('Failed to send password reset email', { to, error });
      throw new Error('Failed to send password reset email');
    }
  }
}

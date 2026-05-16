import { render } from '@react-email/render';
import { Resend } from 'resend';
import { settings } from '../../config/application';
import { logger } from '../../helpers/logger';
import { SendVerificationEmailParams, SendPasswordResetEmailParams } from './interface';
import { VerifyEmailTemplate } from './templates/VerifyEmailTemplate';
import { ResetPasswordTemplate } from './templates/ResetPasswordTemplate';

export class EmailService {
  private readonly client: Resend;

  constructor() {
    this.client = new Resend(settings.resendApiKey);
  }

  async sendVerificationEmail({ to, fullName, token }: SendVerificationEmailParams): Promise<void> {
    const link = `${settings.appUrl}/verify-email?token=${token}`;
    const { error } = await this.client.emails.send({
      from: settings.emailFrom,
      to,
      subject: 'Verify your email address',
      html: await render(<VerifyEmailTemplate fullName={fullName} verifyUrl={link} />)
    });
    if (error) {
      logger.error('Failed to send verification email', { to, error });
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail({ to, fullName, token }: SendPasswordResetEmailParams): Promise<void> {
    const link = `${settings.appUrl}/reset-password?token=${token}`;
    const { error } = await this.client.emails.send({
      from: settings.emailFrom,
      to,
      subject: 'Reset your password',
      html: await render(<ResetPasswordTemplate fullName={fullName} resetUrl={link} />)
    });
    if (error) {
      logger.error('Failed to send password reset email', { to, error });
      throw new Error('Failed to send password reset email');
    }
  }
}

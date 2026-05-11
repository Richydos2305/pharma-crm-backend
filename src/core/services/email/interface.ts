interface SendEmailParams {
  to: string;
  fullName: string;
  token: string;
}

export type SendVerificationEmailParams = SendEmailParams;
export type SendPasswordResetEmailParams = SendEmailParams;

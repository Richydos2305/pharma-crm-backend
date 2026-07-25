export interface SanitizedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
  companyName?: string;
  companyLogo?: string;
  primaryColor?: string;
  branches?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterBody {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: SanitizedUser;
}

export interface RegisterResult {
  message: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

interface EmailBody {
  email: string;
}

export type ResendVerificationBody = EmailBody;
export type ForgotPasswordBody = EmailBody;

export interface VerifyEmailBody {
  token: string;
}

export interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

export interface UpdateProfileBody {
  fullName?: string;
  phoneNumber?: string;
  companyName?: string;
  companyLogo?: string;
  primaryColor?: string;
  branches?: string[];
}

export interface SanitizedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
  companyName?: string;
  companyLogo?: string;
  primaryColor?: string;
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

export type RegisterResult = LoginResult;

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileBody {
  fullName?: string;
  phoneNumber?: string;
  companyName?: string;
  companyLogo?: string;
  primaryColor?: string;
}

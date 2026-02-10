export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  userId: string;
  email: string;
  username: string;
  roles: string[];
}

export interface IAuthService {
  register(input: RegisterInput): Promise<AuthResult>;
  validateCredentials(input: LoginInput): Promise<AuthResult | null>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  verifyEmail(token: string): Promise<void>;
  resendVerificationEmail(email: string): Promise<void>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
}

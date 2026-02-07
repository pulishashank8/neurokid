export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailTemplateData {
  [key: string]: string | number | boolean | undefined;
}

export interface IEmailService {
  send(input: SendEmailInput): Promise<void>;
  sendTemplate(to: string, templateName: string, data: EmailTemplateData): Promise<void>;

  // Convenience methods for common emails
  sendWelcomeEmail(to: string, username: string): Promise<void>;
  sendVerificationEmail(to: string, verificationLink: string): Promise<void>;
  sendPasswordResetEmail(to: string, resetLink: string): Promise<void>;
  sendPasswordChangedEmail(to: string): Promise<void>;
}

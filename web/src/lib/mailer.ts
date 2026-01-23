import { Resend } from 'resend';

const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.neurokid.help';

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;

  // Initialize Resend lazily
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY is not set. Skipping email sending.');
    console.log(`Verification URL for ${email}: ${appUrl}/verify-email?token=${token}`);
    return;
  }

  const resend = new Resend(resendApiKey);

  const verificationUrl = `${appUrl}/verify-email?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: 'Welcome to NeuroKind! Please verify your email',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <title>Verify your NeuroKind email</title>
            <style>
              body {
                background-color: #f9fafb;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
              }
              .container {
                max-width: 570px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                margin-top: 40px;
                margin-bottom: 40px;
              }
              .logo {
                display: block;
                margin-bottom: 30px;
                text-align: center;
              }
              .logo-text {
                font-size: 24px;
                font-weight: 800;
                color: #0f172a;
                text-decoration: none;
                letter-spacing: -0.5px;
              }
              .heading {
                font-size: 24px;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 24px;
                text-align: center;
              }
              .text {
                font-size: 16px;
                line-height: 26px;
                color: #475569;
                margin-bottom: 24px;
              }
              .button-container {
                text-align: center;
                margin: 32px 0;
              }
              .button {
                background-color: #2563eb;
                color: #ffffff;
                font-size: 16px;
                font-weight: 600;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 8px;
                display: inline-block;
                box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
                transition: background-color 0.2s;
              }
              .button:hover {
                background-color: #1d4ed8;
              }
              .footer {
                text-align: center;
                font-size: 13px;
                color: #94a3b8;
                margin-top: 40px;
                border-top: 1px solid #e2e8f0;
                padding-top: 24px;
              }
              .footer p {
                margin: 8px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <a href="${appUrl}" class="logo-text">NeuroKind</a>
              </div>
              <h1 class="heading">Verify your email address</h1>
              <p class="text">
                Hi there,
              </p>
              <p class="text">
                Welcome to NeuroKind! We're excited to have you join our community of parents supporting each other.
              </p>
              <p class="text">
                To get started, please verify your email address by clicking the button below. This helps us keep our community secure and trusted.
              </p>
              <div class="button-container">
                <a href="${verificationUrl}" class="button" target="_blank">Verify Email</a>
              </div>
              <p class="text">
                Or copy and paste this link into your browser:<br/>
                <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
              </p>
              <p class="text">
                This link will expire in 60 minutes.
              </p>
              <div class="footer">
                <p>If you didn't create an account with NeuroKind, you can safely ignore this email.</p>
                <p>© ${new Date().getFullYear()} NeuroKind. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send verification email');
    }
  } catch (error) {
    console.error('Exception sending email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;

  // Initialize Resend lazily
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY is not set. Skipping email sending.');
    console.log(`Reset URL for ${email}: ${appUrl}/reset-password?token=${token}`);
    return;
  }

  const resend = new Resend(resendApiKey);

  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: 'Reset your NeuroKind password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <title>Reset your NeuroKind password</title>
            <style>
              body {
                background-color: #f9fafb;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
              }
              .container {
                max-width: 570px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                margin-top: 40px;
                margin-bottom: 40px;
              }
              .logo {
                display: block;
                margin-bottom: 30px;
                text-align: center;
              }
              .logo-text {
                font-size: 24px;
                font-weight: 800;
                color: #0f172a;
                text-decoration: none;
                letter-spacing: -0.5px;
              }
              .heading {
                font-size: 24px;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 24px;
                text-align: center;
              }
              .text {
                font-size: 16px;
                line-height: 26px;
                color: #475569;
                margin-bottom: 24px;
              }
              .button-container {
                text-align: center;
                margin: 32px 0;
              }
              .button {
                background-color: #e11d48;
                color: #ffffff;
                font-size: 16px;
                font-weight: 600;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 8px;
                display: inline-block;
                box-shadow: 0 4px 6px -1px rgba(225, 29, 72, 0.2);
                transition: background-color 0.2s;
              }
              .button:hover {
                background-color: #be123c;
              }
              .footer {
                text-align: center;
                font-size: 13px;
                color: #94a3b8;
                margin-top: 40px;
                border-top: 1px solid #e2e8f0;
                padding-top: 24px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <a href="${appUrl}" class="logo-text">NeuroKind</a>
              </div>
              <h1 class="heading">Reset your password</h1>
              <p class="text">
                Hi there,
              </p>
              <p class="text">
                Someone requested a password reset for your NeuroKind account. If this was you, please click the button below to reset your password.
              </p>
              <div class="button-container">
                <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
              </div>
              <p class="text">
                Or copy and paste this link into your browser:<br/>
                <a href="${resetUrl}" style="color: #e11d48; word-break: break-all;">${resetUrl}</a>
              </p>
              <p class="text">
                This link will expire in 60 minutes.
              </p>
              <p class="text">
                If you didn't request a password reset, you can safely ignore this email. Your password will not change.
              </p>
              <div class="footer">
                <p>© ${new Date().getFullYear()} NeuroKind. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (error) {
      console.error('Error sending reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  } catch (error) {
    console.error('Exception sending reset email:', error);
    throw error;
  }
}

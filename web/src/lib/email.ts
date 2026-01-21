import { Resend } from 'resend';

// Initialize Resend (will use RESEND_API_KEY from env)
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email: string, otp: string) {
  try {
    // For now, strictly use Resend's testing domain to ensure delivery works
    const fromEmail = 'onboarding@resend.dev';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: 'Verify your NeuroKid account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">NeuroKid</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Welcome to our community!</p>
            </div>
            
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #2C3E50; margin-top: 0;">Verify Your Email</h2>
              <p style="color: #5A6C7D; font-size: 16px;">Thank you for joining NeuroKid! To complete your registration, please use the verification code below:</p>
              
              <div style="background: #F8FAFB; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="color: #5A6C7D; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <p style="font-size: 36px; font-weight: bold; color: #10b981; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
              </div>
              
              <p style="color: #5A6C7D; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
              </p>
              
              <p style="color: #9CA3AF; font-size: 12px; margin: 20px 0 0 0;">
                Best regards,<br>
                The NeuroKid Team
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend API error:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to send OTP email: ${JSON.stringify(error)}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

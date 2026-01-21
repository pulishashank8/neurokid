import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOTPEmail, generateOTP } from '@/lib/email';
import { z } from 'zod';

const SendOTPSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = SendOTPSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        const { email } = parsed.data;

        // Check if email is already registered and verified
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser && existingUser.emailVerified) {
            return NextResponse.json(
                { error: 'Email already registered and verified. Please log in.' },
                { status: 400 }
            );
        }

        // Generate 6-digit OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in database (delete old ones for this email)
        await prisma.emailVerification.deleteMany({
            where: {
                email,
                verified: false,
            },
        });

        await prisma.emailVerification.create({
            data: {
                email,
                otp,
                expiresAt,
            },
        });

        // Send email
        try {
            console.log('🔵 Attempting to send OTP to:', email);
            console.log('🔵 Using API key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
            await sendOTPEmail(email, otp);
            console.log('✅ OTP sent successfully!');
        } catch (emailError: any) {
            console.error('❌ Failed to send OTP email. Error details:');
            console.error('Error message:', emailError?.message);
            console.error('Error stack:', emailError?.stack);
            console.error('Full error:', JSON.stringify(emailError, null, 2));
            return NextResponse.json(
                { error: 'Failed to send verification email. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: 'OTP sent successfully to your email',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Send OTP error:', error);
        return NextResponse.json(
            { error: 'An error occurred. Please try again later.' },
            { status: 500 }
        );
    }
}


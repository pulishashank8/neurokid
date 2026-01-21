// Quick test to verify Resend API key
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('🔍 Testing Resend API...');
console.log('API Key:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
console.log('Target Email:', 'pulishashank8@gmail.com');

async function testEmail() {
    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'pulishashank8@gmail.com',
            subject: 'Test Email (Reverted Settings)',
            html: '<p>This is a test email using onboarding@resend.dev to verified email.</p>',
        });

        if (error) {
            console.error('❌ Resend Error:', JSON.stringify(error, null, 2));
            process.exit(1);
        }

        console.log('✅ Email sent successfully!');
        console.log('Email ID:', data?.id);
        process.exit(0);
    } catch (err) {
        console.error('❌ Exception:', err);
        process.exit(1);
    }
}

testEmail();

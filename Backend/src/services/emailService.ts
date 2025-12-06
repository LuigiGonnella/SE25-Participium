import { Resend } from 'resend';
import { InternalServerError } from '@errors/InternalServerError';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
    email: string,
    name: string,
    verificationCode: string
): Promise<void> {
    try {
        await resend.emails.send({
            from: 'Participium <noreply@participium.org>',
            to: email,
            subject: 'Email Verification - Participium',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to Participium, ${name}!</h2>
                    <p>Thank you for registering. Please use the following verification code to complete your registration:</p>
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #0066cc; letter-spacing: 5px; margin: 0;">${verificationCode}</h1>
                    </div>
                    <p>This code will expire in <strong>30 minutes</strong>.</p>
                    <p>If you didn't request this verification, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #666; font-size: 12px;">This is an automated message from Participium. Please do not reply to this email.</p>
                </div>
            `,
        });
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new InternalServerError('Failed to send verification email');
    }
}

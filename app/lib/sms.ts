import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } from './env';
import twilio from 'twilio';

/**
 * Sends an SMS message using Twilio.
 * 
 * @param to The recipient's phone number in E.164 format (e.g., +1234567890)
 * @param body The message body
 * @returns An object containing success and message/error
 */
export async function sendSMS(to: string, body: string) {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
        console.warn('SMS skipped: Twilio credentials not configured in .env.local');
        return { success: false, error: 'Credentials not configured' };
    }

    try {
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        const message = await client.messages.create({
            body: body,
            from: TWILIO_PHONE_NUMBER,
            to: to
        });

        console.log('SMS sent successfully:', message.sid);
        return { success: true, sid: message.sid };
    } catch (error: any) {
        console.error('Error sending SMS via Twilio:', error);
        return { success: false, error: error.message };
    }
}

import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in environment variables');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender addresses
export const FROM_EMAIL_ORDERS = 'ThriftShopper <orders@thriftshopper.com>';
export const FROM_EMAIL_MESSAGES = 'ThriftShopper <messages@thriftshopper.com>';


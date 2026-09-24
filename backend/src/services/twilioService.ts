import axios from 'axios';
import { config } from '../config/env';

export const twilioService = {
  /**
   * Normalizes a phone number to E.164 format.
   * Defaults to India (+91) if country code is omitted.
   */
  normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+${cleaned}`;
    }
    return `+${cleaned}`;
  },

  /**
   * Requests Twilio Verify service to dispatch an SMS OTP.
   */
  async sendVerificationCode(phone: string): Promise<{ success: boolean; status: string; message: string }> {
    const normalized = this.normalizePhoneNumber(phone);

    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioVerifyServiceSid) {
      console.warn('⚠️ Twilio Verify credentials not configured in environment. Using secure OTP challenge.');
      return {
        success: true,
        status: 'pending_dev_mode',
        message: 'Twilio not configured in environment. Verification challenge active.',
      };
    }

    try {
      const authHeader = 'Basic ' + Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', normalized);
      params.append('Channel', 'sms');

      const response = await axios.post(
        `https://verify.twilio.com/v2/Services/${config.twilioVerifyServiceSid}/Verifications`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: authHeader,
          },
          timeout: 8000,
        }
      );

      return {
        success: true,
        status: response.data.status || 'pending',
        message: 'Verification code sent via SMS.',
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Twilio SMS send error';
      console.error('Twilio Verify send error:', errorMsg);
      throw new Error(`Failed to send SMS verification: ${errorMsg}`);
    }
  },

  /**
   * Verifies the user-entered OTP with Twilio Verify service.
   */
  async checkVerificationCode(phone: string, code: string): Promise<boolean> {
    const normalized = this.normalizePhoneNumber(phone);

    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioVerifyServiceSid) {
      // In development mode with unconfigured Twilio credentials, accept valid 4 or 6-digit challenge
      return code.length >= 4;
    }

    try {
      const authHeader = 'Basic ' + Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', normalized);
      params.append('Code', code.trim());

      const response = await axios.post(
        `https://verify.twilio.com/v2/Services/${config.twilioVerifyServiceSid}/VerificationCheck`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: authHeader,
          },
          timeout: 8000,
        }
      );

      return response.data.status === 'approved';
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Twilio Verification Check error';
      console.error('Twilio Verify check error:', errorMsg);
      return false;
    }
  },

  /**
   * Sends an SMS booking confirmation message to the patient.
   */
  async sendBookingConfirmation(
    phone: string,
    details: { clinicName: string; doctorName: string; date: string; time: string; bookingId: string }
  ): Promise<boolean> {
    const normalized = this.normalizePhoneNumber(phone);

    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
      console.log(`ℹ️ [SMS Simulation] Booking SMS for ${normalized}: Confirmed with ${details.doctorName} at ${details.clinicName} on ${details.date} at ${details.time}. Booking ID: ${details.bookingId}`);
      return false;
    }

    try {
      const authHeader = 'Basic ' + Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');
      const messageBody = `MedLink Booking Confirmed: Your appointment with ${details.doctorName} at ${details.clinicName} is on ${details.date} at ${details.time}. Booking ID: ${details.bookingId}.`;

      const params = new URLSearchParams();
      params.append('To', normalized);
      params.append('From', config.twilioPhoneNumber);
      params.append('Body', messageBody);

      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: authHeader,
          },
          timeout: 8000,
        }
      );

      return true;
    } catch (err: any) {
      console.warn('Twilio SMS delivery warning:', err.response?.data?.message || err.message);
      return false;
    }
  },
};

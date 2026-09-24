import axios from 'axios';
import { config } from '../config/env';

export const resendService = {
  /**
   * Dispatches a verification email containing a 6-digit OTP code using Resend.
   */
  async sendVerificationEmail(email: string, otpCode: string): Promise<boolean> {
    if (!config.resendApiKey) {
      console.log(`ℹ️ [Email Simulation] Resend API Key not set. Verification OTP code for ${email} generated.`);
      return false;
    }

    try {
      await axios.post(
        'https://api.resend.com/emails',
        {
          from: config.emailFrom,
          to: [email],
          subject: 'Your MedLink Verification Code',
          html: `
            <div style="font-family: sans-serif; max-width: 540px; margin: auto; padding: 24px; border: 1px solid #E2E8F0; borderRadius: 12px;">
              <h2 style="color: #0284C7; margin-bottom: 8px;">MedLink Healthcare</h2>
              <p style="color: #475569; font-size: 15px;">Please use the following 6-digit verification code to complete your verification:</p>
              <div style="background: #F0F9FF; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0369A1;">${otpCode}</span>
              </div>
              <p style="color: #94A3B8; font-size: 13px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${config.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }
      );
      return true;
    } catch (err: any) {
      console.warn('Resend email delivery error:', err.response?.data || err.message);
      return false;
    }
  },

  /**
   * Dispatches a comprehensive appointment confirmation email.
   */
  async sendBookingConfirmationEmail(
    email: string,
    details: {
      patientName: string;
      doctorName: string;
      clinicName: string;
      clinicAddress: string;
      department: string;
      date: string;
      time: string;
      reason: string;
      bookingId: string;
      tokenNumber: string;
    }
  ): Promise<boolean> {
    if (!config.resendApiKey) {
      console.log(`ℹ️ [Email Simulation] Booking confirmation email for ${email}: Appointment #${details.bookingId} with ${details.doctorName} at ${details.clinicName}`);
      return false;
    }

    try {
      await axios.post(
        'https://api.resend.com/emails',
        {
          from: config.emailFrom,
          to: [email],
          subject: `Confirmed: Consultation with ${details.doctorName} (${details.date})`,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background: #FFFFFF;">
              <h2 style="color: #0284C7; margin-top: 0;">Appointment Confirmed ✅</h2>
              <p style="color: #334155; font-size: 15px;">Hello <strong>${details.patientName}</strong>,</p>
              <p style="color: #475569; font-size: 14px;">Your consultation has been successfully booked. Here are your appointment details:</p>
              
              <div style="background: #F8FAFC; border-left: 4px solid #0284C7; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 4px 0; color: #1E293B;"><strong>Doctor:</strong> ${details.doctorName} (${details.department})</p>
                <p style="margin: 4px 0; color: #1E293B;"><strong>Clinic:</strong> ${details.clinicName}</p>
                <p style="margin: 4px 0; color: #1E293B;"><strong>Address:</strong> ${details.clinicAddress}</p>
                <p style="margin: 4px 0; color: #1E293B;"><strong>Date & Time:</strong> ${details.date} at ${details.time}</p>
                <p style="margin: 4px 0; color: #1E293B;"><strong>Assigned Token:</strong> <span style="color: #0284C7; font-weight: 700;">${details.tokenNumber}</span></p>
                <p style="margin: 4px 0; color: #1E293B;"><strong>Booking ID:</strong> ${details.bookingId}</p>
              </div>

              <p style="color: #64748B; font-size: 13px;">Please arrive 10 minutes prior to your consultation time. You can monitor your live queue position in real time through the MedLink Patient App.</p>
            </div>
          `,
        },
        {
          headers: {
            Authorization: `Bearer ${config.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }
      );
      return true;
    } catch (err: any) {
      console.warn('Resend booking confirmation email error:', err.response?.data || err.message);
      return false;
    }
  },
};

import { NotificationModel, NotificationEntity, AppointmentEntity, DoctorEntity, WalkInEntity } from '../database/models';
import { emitToPatient, emitToDoctor, emitToClinic, emitBroadcast } from './socketService';
import { twilioService } from './twilioService';
import { resendService } from './resendService';

export interface CreateNotificationParams {
  recipientId?: string;
  recipientType?: 'PATIENT' | 'DOCTOR' | 'CLINIC';
  patientId?: string;
  doctorId?: string;
  clinicId?: string;
  appointmentId?: string;
  queueId?: string;
  title: string;
  message: string;
  category?: 'Appointments' | 'Queue Updates' | 'Clinic Updates' | 'Reminders' | 'System' | 'Announcements' | 'Emergency' | 'Doctor Delays';
  type?: 'appointment' | 'system' | 'reminder' | 'announcement' | 'emergency' | 'delay' | 'verification' | 'prescription' | 'queue';
  actionData?: any;
  phone?: string;
  email?: string;
}

export const notificationService = {
  /**
   * Core centralized provider-independent notification dispatcher.
   * Persists in DB store, broadcasts via Socket.IO, and optionally dispatches SMS/Email.
   */
  async sendNotification(params: CreateNotificationParams): Promise<NotificationEntity> {
    const recipientType = params.recipientType || (params.patientId ? 'PATIENT' : params.doctorId ? 'DOCTOR' : 'CLINIC');
    const recipientId = params.recipientId || params.patientId || params.doctorId || params.clinicId || 'system';

    // 1. Core: In-App Persistent Database Storage
    const notification = await NotificationModel.create({
      recipient_id: recipientId,
      recipient_type: recipientType,
      patient_id: params.patientId,
      doctor_id: params.doctorId,
      clinic_id: params.clinicId,
      appointment_id: params.appointmentId,
      queue_id: params.queueId,
      title: params.title,
      message: params.message,
      timestamp: 'Just now',
      read: false,
      is_read: false,
      category: params.category || 'Appointments',
      type: params.type || 'appointment',
      action_data: params.actionData || {},
    });

    // 2. Real-Time Socket.IO Targeting
    try {
      if (params.patientId) {
        emitToPatient(params.patientId, 'notification:new', notification);
      }
      if (params.doctorId) {
        emitToDoctor(params.doctorId, 'notification:new', notification);
      }
      if (params.clinicId) {
        emitToClinic(params.clinicId, 'notification:new', notification);
      }
    } catch (sockErr) {
      console.warn('Socket emission warning in notificationService:', sockErr);
    }

    // 3. Optional External Channels: SMS (Twilio) & Email (Resend)
    // Never fail the primary in-app notification if external credentials or networks fail
    if (params.phone) {
      try {
        await twilioService.sendBookingConfirmation(params.phone, {
          doctorName: params.actionData?.doctorName || 'Doctor',
          clinicName: params.actionData?.clinicName || 'Clinic',
          date: params.actionData?.date || 'Today',
          time: params.actionData?.time || 'Scheduled Time',
          bookingId: params.appointmentId || 'APT',
        });
      } catch (smsErr) {
        console.warn('Optional SMS delivery skipped/failed:', smsErr);
      }
    }

    if (params.email) {
      try {
        await resendService.sendBookingConfirmationEmail(params.email, {
          patientName: params.actionData?.patientName || 'Patient',
          doctorName: params.actionData?.doctorName || 'Doctor',
          department: params.actionData?.specialization || params.actionData?.department || 'Consultation',
          clinicName: params.actionData?.clinicName || 'Clinic',
          clinicAddress: params.actionData?.clinicAddress || 'Clinic Address',
          date: params.actionData?.date || 'Today',
          time: params.actionData?.time || 'Scheduled Time',
          reason: params.actionData?.reason || 'Clinical Consultation',
          tokenNumber: params.actionData?.tokenNumber || 'A001',
          bookingId: params.appointmentId || 'APT',
        });
      } catch (emailErr) {
        console.warn('Optional email delivery skipped/failed:', emailErr);
      }
    }

    return notification;
  },

  /**
   * Trigger: Appointment Booked
   */
  async notifyAppointmentBooked(apt: AppointmentEntity, patientEmail?: string, patientPhone?: string): Promise<void> {
    // Patient Notification
    await this.sendNotification({
      patientId: apt.patient_id,
      recipientType: 'PATIENT',
      appointmentId: apt.id,
      clinicId: apt.clinic_id,
      doctorId: apt.doctor_id,
      title: 'Appointment Confirmed 📅',
      message: `Your appointment with ${apt.doctor_name} at ${apt.clinic_name} is confirmed for ${apt.date} at ${apt.time}. Token: ${apt.token_number || 'A001'}.`,
      category: 'Appointments',
      type: 'appointment',
      actionData: {
        appointmentId: apt.id,
        doctorName: apt.doctor_name,
        clinicName: apt.clinic_name,
        date: apt.date,
        time: apt.time,
        tokenNumber: apt.token_number,
      },
      phone: patientPhone,
      email: patientEmail,
    });

    // Doctor Notification
    await this.sendNotification({
      doctorId: apt.doctor_id,
      recipientType: 'DOCTOR',
      appointmentId: apt.id,
      clinicId: apt.clinic_id,
      title: 'New Appointment Booked 🩺',
      message: `${apt.patient_name || 'Patient'} scheduled a consultation for ${apt.date} at ${apt.time} (${apt.reason || 'General'}).`,
      category: 'Appointments',
      type: 'appointment',
      actionData: { appointmentId: apt.id, patientName: apt.patient_name, time: apt.time },
    });

    // Clinic Assistant Notification
    await this.sendNotification({
      clinicId: apt.clinic_id,
      recipientType: 'CLINIC',
      appointmentId: apt.id,
      title: 'New Online Booking 🏥',
      message: `${apt.patient_name || 'Patient'} booked with ${apt.doctor_name} at ${apt.time}.`,
      category: 'Appointments',
      type: 'appointment',
      actionData: { appointmentId: apt.id, doctorName: apt.doctor_name, time: apt.time },
    });
  },

  /**
   * Trigger: Patient Check-In
   */
  async notifyPatientCheckIn(apt: AppointmentEntity): Promise<void> {
    // Patient
    await this.sendNotification({
      patientId: apt.patient_id,
      recipientType: 'PATIENT',
      appointmentId: apt.id,
      clinicId: apt.clinic_id,
      title: 'Checked In Successfully 🎫',
      message: `You are checked in! Token: ${apt.token_number}. Position: #${apt.queue_position}. Estimated wait: ${apt.estimated_wait}.`,
      category: 'Queue Updates',
      type: 'queue',
      actionData: { appointmentId: apt.id, tokenNumber: apt.token_number, queuePosition: apt.queue_position },
    });

    // Doctor
    await this.sendNotification({
      doctorId: apt.doctor_id,
      recipientType: 'DOCTOR',
      appointmentId: apt.id,
      clinicId: apt.clinic_id,
      title: 'Patient Checked In 👥',
      message: `${apt.patient_name} (Token ${apt.token_number}) checked in and is waiting in reception.`,
      category: 'Queue Updates',
      type: 'queue',
      actionData: { appointmentId: apt.id, tokenNumber: apt.token_number },
    });

    // Clinic Assistant
    await this.sendNotification({
      clinicId: apt.clinic_id,
      recipientType: 'CLINIC',
      appointmentId: apt.id,
      title: 'Patient Checked In 🏢',
      message: `Token ${apt.token_number} (${apt.patient_name}) entered waiting queue for ${apt.doctor_name}.`,
      category: 'Queue Updates',
      type: 'queue',
      actionData: { appointmentId: apt.id, tokenNumber: apt.token_number },
    });
  },

  /**
   * Trigger: Dynamic Queue Position Updates
   */
  async notifyQueuePositionUpdate(
    patientId: string,
    appointmentId: string,
    queuePosition: number,
    patientsAhead: number,
    estimatedWait: string,
    tokenNumber: string
  ): Promise<void> {
    let title = 'Queue Position Update 📊';
    let message = `You are currently #${queuePosition} in queue (${patientsAhead} ahead). Estimated wait: ${estimatedWait}.`;

    if (queuePosition === 1 || patientsAhead === 0) {
      title = "You're Next! 🔔";
      message = `Token ${tokenNumber} is now next! Please proceed to the consultation room.`;
    } else if (queuePosition === 2 || patientsAhead === 1) {
      title = 'Almost Your Turn ⏱️';
      message = `1 patient ahead. Please stay near the OPD waiting area.`;
    }

    await this.sendNotification({
      patientId,
      recipientType: 'PATIENT',
      appointmentId,
      title,
      message,
      category: 'Queue Updates',
      type: 'queue',
      actionData: { appointmentId, queuePosition, patientsAhead, estimatedWait, tokenNumber },
    });
  },

  /**
   * Trigger: Doctor Delay Advisory
   */
  async notifyDoctorDelay(
    doctorId: string,
    doctorName: string,
    clinicId: string,
    delayMinutes: number,
    affectedAppointments: AppointmentEntity[]
  ): Promise<void> {
    // Notify Clinic Assistant
    await this.sendNotification({
      clinicId,
      recipientType: 'CLINIC',
      doctorId,
      title: 'Doctor Delay Advisory ⏱️',
      message: `${doctorName} reported a delay of approximately ${delayMinutes} minutes. Downstream queue updated.`,
      category: 'Doctor Delays',
      type: 'delay',
      actionData: { doctorId, delayMinutes },
    });

    // Notify Doctor
    await this.sendNotification({
      doctorId,
      recipientType: 'DOCTOR',
      clinicId,
      title: 'Delay Advisory Broadcasted ⏱️',
      message: `Reported ${delayMinutes} mins delay. ${affectedAppointments.length} waiting patient(s) notified.`,
      category: 'Doctor Delays',
      type: 'delay',
      actionData: { delayMinutes },
    });

    // Notify each affected patient
    for (const apt of affectedAppointments) {
      await this.sendNotification({
        patientId: apt.patient_id,
        recipientType: 'PATIENT',
        appointmentId: apt.id,
        clinicId: apt.clinic_id,
        doctorId: apt.doctor_id,
        title: 'Doctor Delay Advisory ⏱️',
        message: `${doctorName} is running approximately ${delayMinutes} minutes behind schedule. Your estimated wait has been updated.`,
        category: 'Doctor Delays',
        type: 'delay',
        actionData: { appointmentId: apt.id, delayMinutes, estimatedWait: apt.estimated_wait },
      });
    }
  },

  /**
   * Trigger: Emergency Walk-In Intake
   */
  async notifyEmergencyIntake(walkIn: WalkInEntity, queueNumber: string, clinicId?: string, doctorId?: string): Promise<void> {
    // Clinic Assistant
    await this.sendNotification({
      clinicId: clinicId || 'c1',
      recipientType: 'CLINIC',
      title: 'Emergency Patient Intake 🚨',
      message: `Emergency patient ${walkIn.patient_name} admitted (Token ${queueNumber}). Preempted to Position #1 in queue.`,
      category: 'Emergency',
      type: 'emergency',
      actionData: { walkInId: walkIn.id, queueNumber, priority: 'EMERGENCY' },
    });

    // Doctor
    if (doctorId) {
      await this.sendNotification({
        doctorId,
        recipientType: 'DOCTOR',
        clinicId,
        title: 'Urgent: Emergency Patient Added 🚨',
        message: `High-priority emergency patient ${walkIn.patient_name} (Token ${queueNumber}) placed at front of your queue.`,
        category: 'Emergency',
        type: 'emergency',
        actionData: { walkInId: walkIn.id, queueNumber, priority: 'EMERGENCY' },
      });
    }
  },

  /**
   * Trigger: Normal Walk-In Intake
   */
  async notifyWalkIn(walkIn: WalkInEntity, queueNumber: string, clinicId?: string, doctorId?: string): Promise<void> {
    await this.sendNotification({
      clinicId: clinicId || 'c1',
      recipientType: 'CLINIC',
      title: 'Walk-In Registered 🚶',
      message: `${walkIn.patient_name} registered as walk-in (Token ${queueNumber}) for ${walkIn.preferred_doctor}.`,
      category: 'Queue Updates',
      type: 'queue',
      actionData: { walkInId: walkIn.id, queueNumber },
    });

    if (doctorId) {
      await this.sendNotification({
        doctorId,
        recipientType: 'DOCTOR',
        clinicId,
        title: 'Walk-in Patient Added 📋',
        message: `${walkIn.patient_name} added to OPD queue (${queueNumber}).`,
        category: 'Queue Updates',
        type: 'queue',
        actionData: { walkInId: walkIn.id, queueNumber },
      });
    }
  },

  /**
   * Trigger: Patient No-Show
   */
  async notifyNoShow(apt: AppointmentEntity): Promise<void> {
    await this.sendNotification({
      patientId: apt.patient_id,
      recipientType: 'PATIENT',
      appointmentId: apt.id,
      clinicId: apt.clinic_id,
      title: 'Appointment Marked No-Show ⚠️',
      message: `Your appointment with ${apt.doctor_name} has been marked as No-Show. Please contact reception to reschedule.`,
      category: 'Appointments',
      type: 'appointment',
      actionData: { appointmentId: apt.id },
    });

    await this.sendNotification({
      clinicId: apt.clinic_id,
      recipientType: 'CLINIC',
      appointmentId: apt.id,
      title: 'Patient Marked No-Show 📋',
      message: `${apt.patient_name} (Token ${apt.token_number}) marked as No-Show. Queue re-calculated.`,
      category: 'Queue Updates',
      type: 'queue',
      actionData: { appointmentId: apt.id },
    });
  },

  /**
   * Trigger: Earlier Slot Available Offer
   */
  async notifyEarlierSlotAvailable(
    appointmentId: string,
    patientId: string,
    doctorName: string,
    newDate: string,
    newTime: string,
    timeDifference: string
  ): Promise<void> {
    await this.sendNotification({
      patientId,
      recipientType: 'PATIENT',
      appointmentId,
      title: 'Earlier Appointment Available ⚡',
      message: `An earlier slot opened with ${doctorName} at ${newTime} (${timeDifference}). Tap to accept or keep current time.`,
      category: 'Appointments',
      type: 'appointment',
      actionData: { appointmentId, newDate, newTime, timeDifference },
    });
  },

  /**
   * Trigger: Earlier Slot Accepted
   */
  async notifyEarlierSlotAccepted(apt: AppointmentEntity): Promise<void> {
    await this.sendNotification({
      patientId: apt.patient_id,
      recipientType: 'PATIENT',
      appointmentId: apt.id,
      clinicId: apt.clinic_id,
      title: 'Appointment Rescheduled 📅',
      message: `Your appointment with ${apt.doctor_name} is moved to earlier time: ${apt.time} (${apt.date}).`,
      category: 'Appointments',
      type: 'appointment',
      actionData: { appointmentId: apt.id, date: apt.date, time: apt.time },
    });

    await this.sendNotification({
      clinicId: apt.clinic_id,
      recipientType: 'CLINIC',
      appointmentId: apt.id,
      title: 'Slot Reassignment Accepted ⚡',
      message: `${apt.patient_name} accepted earlier slot for ${apt.time} with ${apt.doctor_name}.`,
      category: 'Appointments',
      type: 'appointment',
      actionData: { appointmentId: apt.id, patientName: apt.patient_name, time: apt.time },
    });
  },

  /**
   * Trigger: Consultation Completed & Prescription Issued
   */
  async notifyConsultationCompleted(apt: AppointmentEntity, prescriptionMedicinesCount: number): Promise<void> {
    // Patient
    await this.sendNotification({
      patientId: apt.patient_id,
      recipientType: 'PATIENT',
      appointmentId: apt.id,
      clinicId: apt.clinic_id,
      doctorId: apt.doctor_id,
      title: 'Prescription Available in Health Records 💊',
      message: `Your consultation with ${apt.doctor_name} is complete. ${prescriptionMedicinesCount} medicine(s) prescribed. View details in Health Records.`,
      category: 'Appointments',
      type: 'prescription',
      actionData: { appointmentId: apt.id, doctorName: apt.doctor_name },
    });

    // Doctor
    await this.sendNotification({
      doctorId: apt.doctor_id,
      recipientType: 'DOCTOR',
      appointmentId: apt.id,
      clinicId: apt.clinic_id,
      title: 'Consultation Completed ✅',
      message: `Clinical notes and prescription recorded for ${apt.patient_name}.`,
      category: 'Appointments',
      type: 'appointment',
      actionData: { appointmentId: apt.id, patientName: apt.patient_name },
    });
  },

  /**
   * Trigger: Doctor Registration (Under Review)
   */
  async notifyDoctorVerificationRequested(doctor: DoctorEntity): Promise<void> {
    await this.sendNotification({
      clinicId: doctor.clinic_id || 'c1',
      recipientType: 'CLINIC',
      doctorId: doctor.id,
      title: 'Doctor Verification Required 🛡️',
      message: `${doctor.name} (${doctor.specialization}, Reg: ${doctor.registration_number || 'Pending'}) registered and requires credential review.`,
      category: 'Clinic Updates',
      type: 'verification',
      actionData: { doctorId: doctor.id, doctorName: doctor.name, registrationNumber: doctor.registration_number },
    });
  },

  /**
   * Trigger: Doctor Verification Completed (Approved / Rejected)
   */
  async notifyDoctorVerificationCompleted(doctor: DoctorEntity, isApproved: boolean): Promise<void> {
    await this.sendNotification({
      doctorId: doctor.id,
      recipientType: 'DOCTOR',
      clinicId: doctor.clinic_id,
      title: isApproved ? 'Doctor Verification Approved 🎉' : 'Doctor Verification Update 📋',
      message: isApproved
        ? 'Your practitioner credentials have been verified. You are now active and bookable on MedLink.'
        : `Verification status updated: ${doctor.verification_status}.`,
      category: 'System',
      type: 'verification',
      actionData: { doctorId: doctor.id, isVerified: doctor.is_verified, status: doctor.verification_status },
    });

    await this.sendNotification({
      clinicId: doctor.clinic_id,
      recipientType: 'CLINIC',
      doctorId: doctor.id,
      title: 'Doctor Verification Completed 📋',
      message: `${doctor.name} status updated to ${doctor.verification_status}.`,
      category: 'Clinic Updates',
      type: 'verification',
      actionData: { doctorId: doctor.id, status: doctor.verification_status },
    });
  },
};

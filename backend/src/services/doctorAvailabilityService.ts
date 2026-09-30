import {
  DoctorModel,
  ClinicModel,
  DoctorScheduleModel,
  DoctorAvailabilityModel,
  DoctorEntity,
  DoctorBreakInterval,
  DoctorAvailabilityState,
  resolveCanonicalClinicId,
  resolveCanonicalDoctorId,
  AvailabilityRequestModel,
  DoctorClinicAssignmentModel,
} from '../database/models';
import { memoryDb } from '../database/db';
import { timeService } from './timeService';

export interface DoctorDaySchedule {
  doctorId: string;
  clinicId: string;
  date: string;
  dayName: string;
  dayShort: string;
  isOffDuty: boolean;
  isOnLeave: boolean;
  isUnavailableToday: boolean;
  isEmergencyClosed: boolean;
  availabilityStatus: DoctorAvailabilityState;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  breaks: Array<{ start: string; end: string; startMins: number; endMins: number; reason?: string }>;
  consultationDurationMinutes: number;
}

export interface DoctorSlotItem {
  time: string;
  status: 'Available' | 'Unavailable' | 'Recommended' | 'Limited';
  reasoning?: string;
  isAvailable: boolean;
}

export interface DoctorSlotsResult {
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  department: string;
  date: string;
  dayName: string;
  availabilityStatus: DoctorAvailabilityState;
  isAvailableToday: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  breaks: Array<{ start: string; end: string; reason?: string }>;
  consultationDurationMinutes: number;
  totalSlotsCount: number;
  availableSlotsCount: number;
  slots: {
    morning: DoctorSlotItem[];
    afternoon: DoctorSlotItem[];
    evening: DoctorSlotItem[];
  };
}

export interface SlotValidationResult {
  valid: boolean;
  code?: 'PAST_DATE' | 'PAST_SLOT' | 'DOCTOR_NOT_FOUND' | 'CLINIC_NOT_FOUND' | 'CLINIC_MISMATCH' | 'DOCTOR_ON_LEAVE' | 'DOCTOR_OFF_DUTY' | 'DOCTOR_UNAVAILABLE' | 'OUT_OF_HOURS' | 'SLOT_IN_BREAK' | 'SLOT_NO_LONGER_AVAILABLE';
  error?: string;
  normalizedDate?: string;
  normalizedTime?: string;
  doctor?: DoctorEntity;
  schedule?: DoctorDaySchedule;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim();
  const isPM = clean.toUpperCase().includes('PM');
  const isAM = clean.toUpperCase().includes('AM');
  const parts = clean.replace(/[^\d:]/g, '').split(':');
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function formatMinutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function getDayOfWeekFromDate(normDate: string): { dayName: string; dayShort: string } {
  const [year, month, day] = normDate.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dow = d.getUTCDay();
  return {
    dayName: dayNames[dow] || 'Monday',
    dayShort: dayShortNames[dow] || 'Mon',
  };
}

export const doctorAvailabilityService = {
  /**
   * Resolves the authoritative day schedule, working hours, breaks, and availability status for a doctor on a specific date.
   */
  async getDoctorScheduleForDate(doctor: DoctorEntity, dateStr: string): Promise<DoctorDaySchedule> {
    const normDate = timeService.normalizeDateString(dateStr);
    const { dayName, dayShort } = getDayOfWeekFromDate(normDate);
    const isToday = timeService.isToday(normDate);

    // 1. Check leave exceptions
    const exceptions = await DoctorScheduleModel.getExceptionsByDoctorId(doctor.id);
    const leaveException = exceptions.find(
      (ex) => timeService.normalizeDateString(ex.date) === normDate
    );
    const isOnLeave = !!leaveException;

    // 2. Check weekly schedule & working days
    let isOffDuty = false;
    let startTime = '09:00 AM';
    let endTime = '05:00 PM';
    let durMinutes = parseInt(doctor.consultation_duration?.replace(/[^0-9]/g, '') || '20', 10) || 20;

    if (doctor.schedule && doctor.schedule[dayName]) {
      const dayConfig = doctor.schedule[dayName];
      if (dayConfig.is_off) {
        isOffDuty = true;
      }
      if (dayConfig.start) startTime = dayConfig.start;
      if (dayConfig.end) endTime = dayConfig.end;
      if (dayConfig.slot_duration) durMinutes = dayConfig.slot_duration;
    } else if (doctor.available_days && doctor.available_days.length > 0) {
      const match = doctor.available_days.some(
        (ad) => ad.toLowerCase() === dayShort.toLowerCase() || ad.toLowerCase() === dayName.toLowerCase()
      );
      if (!match) {
        isOffDuty = true;
      }
    }

    // 3. Check date-specific overrides from DoctorAvailabilityModel
    const specificAvail = memoryDb.doctor_availability.get(`${doctor.id}_${normDate}`);
    let breaksList: DoctorBreakInterval[] = [
      { start: '01:00 PM', end: '02:00 PM', reason: 'Lunch Break' },
    ];

    let isEmergencyClosed = false;
    let overrideStatus: DoctorAvailabilityState | null = null;

    if (specificAvail) {
      if (specificAvail.start_time) startTime = specificAvail.start_time;
      if (specificAvail.end_time) endTime = specificAvail.end_time;
      if (specificAvail.breaks && Array.isArray(specificAvail.breaks)) {
        breaksList = specificAvail.breaks;
      }
      if (specificAvail.consultation_duration_minutes) {
        durMinutes = specificAvail.consultation_duration_minutes;
      }
      if (specificAvail.emergency_closure) {
        isEmergencyClosed = true;
      }
      if (specificAvail.availability_status) {
        overrideStatus = specificAvail.availability_status;
      }
    }

    // 4. Check today-only unavailability
    const isUnavailableToday = isToday && (doctor.status === 'OFFLINE' || doctor.is_available_today === false);

    // 5. Determine effective availability status
    let availabilityStatus: DoctorAvailabilityState = 'AVAILABLE';
    if (isOnLeave) {
      availabilityStatus = 'ON_LEAVE';
    } else if (isEmergencyClosed) {
      availabilityStatus = 'EMERGENCY_CLOSED';
    } else if (isOffDuty) {
      availabilityStatus = 'UNAVAILABLE';
    } else if (isUnavailableToday) {
      availabilityStatus = 'UNAVAILABLE';
    } else if (overrideStatus) {
      availabilityStatus = overrideStatus;
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    const parsedBreaks = breaksList.map((b) => ({
      start: b.start,
      end: b.end,
      startMins: parseTimeToMinutes(b.start),
      endMins: parseTimeToMinutes(b.end),
      reason: b.reason,
    }));

    return {
      doctorId: doctor.id,
      clinicId: doctor.clinic_id,
      date: normDate,
      dayName,
      dayShort,
      isOffDuty,
      isOnLeave,
      isUnavailableToday,
      isEmergencyClosed,
      availabilityStatus,
      startTime,
      endTime,
      startMinutes,
      endMinutes,
      breaks: parsedBreaks,
      consultationDurationMinutes: durMinutes,
    };
  },

  /**
   * Generates morning, afternoon, and evening slots for a doctor and date, strictly respecting working hours, breaks, leave, appointments, and clinic availability approval.
   */
  async generateDoctorSlots(doctorId: string, dateStr: string, clinicId?: string): Promise<DoctorSlotsResult> {
    const doctor = await DoctorModel.getById(doctorId);
    if (!doctor) {
      throw new Error(`Doctor with ID ${doctorId} not found.`);
    }

    const normDate = timeService.normalizeDateString(dateStr);
    let schedule = await this.getDoctorScheduleForDate(doctor, normDate);

    let activeClinicId = doctor.clinic_id;
    let activeClinicName = doctor.clinic_name;

    const canonicalTargetClinic = clinicId
      ? resolveCanonicalClinicId(clinicId)
      : resolveCanonicalClinicId(doctor.clinic_id);

    const targetClinic = await ClinicModel.getById(canonicalTargetClinic);
    if (targetClinic) {
      activeClinicId = targetClinic.id;
      activeClinicName = targetClinic.name;
    }

    const isPrimaryClinic = canonicalTargetClinic === resolveCanonicalClinicId(doctor.clinic_id);

    // Retrieve ALL approved requests for this doctor, clinic, and date
    const approvedRequests = await AvailabilityRequestModel.getAllApprovedForDoctorAndClinic(
      doctor.id,
      canonicalTargetClinic,
      normDate
    );

    // Check all requests for this doctor, clinic, and date
    const allRequestsForDate = await AvailabilityRequestModel.getRequests({
      doctorId: doctor.id,
      clinicId: canonicalTargetClinic,
      date: normDate,
    });

    const hasApproved = approvedRequests.length > 0;

    // Strict rule: MUST have an approved availability request to generate bookable slots.
    // If no availability request is approved for this clinic and date, return UNAVAILABLE with 0 slots.
    if (!hasApproved) {
      return {
        doctorId: doctor.id,
        doctorName: doctor.name,
        clinicId: activeClinicId,
        clinicName: activeClinicName,
        department: doctor.specialization,
        date: normDate,
        dayName: schedule.dayName,
        availabilityStatus: 'UNAVAILABLE',
        isAvailableToday: false,
        workingHours: { start: '', end: '' },
        breaks: [],
        consultationDurationMinutes: schedule.consultationDurationMinutes,
        totalSlotsCount: 0,
        availableSlotsCount: 0,
        slots: { morning: [], afternoon: [], evening: [] },
      };
    }

    // Collect active appointments for this doctor on this date
    const bookedTimes = new Set<string>();
    for (const apt of memoryDb.appointments.values()) {
      const aptDate = timeService.normalizeDateString(apt.date || apt.appointmentDate);
      if (
        apt.doctor_id === doctor.id &&
        aptDate === normDate &&
        !['Cancelled', 'CANCELLED', 'No Show', 'NO_SHOW', 'No-Show'].includes(apt.status)
      ) {
        bookedTimes.add(timeService.normalizeTimeString(apt.time || apt.slotStartTime));
      }
    }

    const isToday = timeService.isToday(normDate);
    const currentClinicDate = timeService.getCurrentClinicDate();
    const currentTotalMinutes = currentClinicDate.getHours() * 60 + currentClinicDate.getMinutes();

    const isSlotPast = (slotMins: number) => {
      if (!isToday) return false;
      return currentTotalMinutes >= slotMins;
    };

    const morning: DoctorSlotItem[] = [];
    const afternoon: DoctorSlotItem[] = [];
    const evening: DoctorSlotItem[] = [];

    const consultationDurationMinutes = schedule.consultationDurationMinutes || 20;

    // Define time windows to generate slots from
    interface TimeWindow {
      startMins: number;
      endMins: number;
      startStr: string;
      endStr: string;
    }

    // Windows are derived strictly from approved availability requests
    const windows: TimeWindow[] = approvedRequests.map((req) => ({
      startMins: parseTimeToMinutes(req.start_time),
      endMins: parseTimeToMinutes(req.end_time),
      startStr: req.start_time,
      endStr: req.end_time,
    }));

    // Sort windows chronologically
    windows.sort((a, b) => a.startMins - b.startMins);

    const clinicLiveStatus = await DoctorClinicAssignmentModel.getStatus(doctor.id, canonicalTargetClinic);
    const effectiveLiveStatus = clinicLiveStatus || doctor.status;
    const isLiveUnavailable = isToday && (effectiveLiveStatus === 'OFFLINE' || effectiveLiveStatus === 'BUSY');

    // If doctor has approved requests for this clinic and date, doctor is explicitly available for them
    const isDoctorDisabled = isLiveUnavailable || (hasApproved
      ? schedule.isOnLeave || schedule.isEmergencyClosed
      : schedule.isOnLeave ||
        schedule.isOffDuty ||
        schedule.isUnavailableToday ||
        schedule.isEmergencyClosed ||
        schedule.availabilityStatus === 'UNAVAILABLE');

    const generatedSlotTimes = new Set<string>();

    for (const win of windows) {
      for (let m = win.startMins; m + consultationDurationMinutes <= win.endMins; m += consultationDurationMinutes) {
        // Check break collision: slot [m, m + dur] overlaps break [b.start, b.end]
        const overlapsBreak = schedule.breaks.some(
          (b) => m < b.endMins && m + consultationDurationMinutes > b.startMins
        );
        if (overlapsBreak) {
          continue;
        }

        const slotTime = formatMinutesToTime(m);
        if (generatedSlotTimes.has(slotTime)) {
          continue;
        }
        generatedSlotTimes.add(slotTime);

        const isPast = isSlotPast(m);
        const isBooked = bookedTimes.has(slotTime);

        const isAvailable = !isDoctorDisabled && !isPast && !isBooked;

        const slotItem: DoctorSlotItem = {
          time: slotTime,
          status: isAvailable ? 'Available' : 'Unavailable',
          isAvailable,
        };

        if (m < 720) {
          morning.push(slotItem);
        } else if (m < 1020) {
          afternoon.push(slotItem);
        } else {
          evening.push(slotItem);
        }
      }
    }

    const allSlots = [...morning, ...afternoon, ...evening];
    const availableSlots = allSlots.filter((s) => s.isAvailable);

    // Lowest wait recommendation
    if (availableSlots.length > 2) {
      const midIdx = Math.floor(availableSlots.length / 2);
      availableSlots[midIdx].status = 'Recommended';
      availableSlots[midIdx].reasoning = 'Lowest estimated wait (~8 min)';
    }

    // Effective overall status for approved schedule
    let effectiveStatus: DoctorAvailabilityState = 'AVAILABLE';
    if (isLiveUnavailable) {
      effectiveStatus = (effectiveLiveStatus === 'BUSY' ? 'BUSY' : 'OFFLINE') as DoctorAvailabilityState;
    } else if (allSlots.length > 0 && availableSlots.length === 0) {
      effectiveStatus = 'FULLY_BOOKED';
    }

    return {
      doctorId: doctor.id,
      doctorName: doctor.name,
      clinicId: activeClinicId,
      clinicName: activeClinicName,
      department: doctor.specialization,
      date: normDate,
      dayName: schedule.dayName,
      availabilityStatus: effectiveStatus,
      isAvailableToday: effectiveStatus === 'AVAILABLE' && availableSlots.length > 0,
      workingHours: {
        start: windows[0]?.startStr || schedule.startTime,
        end: windows[windows.length - 1]?.endStr || schedule.endTime,
      },
      breaks: schedule.breaks.map((b) => ({ start: b.start, end: b.end, reason: b.reason })),
      consultationDurationMinutes: schedule.consultationDurationMinutes,
      totalSlotsCount: allSlots.length,
      availableSlotsCount: availableSlots.length,
      slots: {
        morning,
        afternoon,
        evening,
      },
    };
  },

  /**
   * Authoritative backend slot validation.
   * Revalidates doctor affiliation, date validity, leave, working hours, break overlap, past slot, and existing appointments.
   */
  async validateSlotAvailability(
    doctorId: string,
    clinicId: string,
    dateStr: string,
    timeStr: string,
    options?: { excludeAppointmentId?: string; consultationDurationMinutes?: number }
  ): Promise<SlotValidationResult> {
    const doctor = await DoctorModel.getById(doctorId);
    if (!doctor) {
      return { valid: false, code: 'DOCTOR_NOT_FOUND', error: 'Doctor not found in registry.' };
    }

    const clinic = await ClinicModel.getById(clinicId);
    if (!clinic) {
      return { valid: false, code: 'CLINIC_NOT_FOUND', error: 'Clinic not found in registry.' };
    }

    // Clinic boundary check
    const docClinicCanonical = resolveCanonicalClinicId(doctor.clinic_id);
    const targetClinicCanonical = resolveCanonicalClinicId(clinic.id);
    const isAssigned = await DoctorClinicAssignmentModel.isAssigned(doctor.id, targetClinicCanonical);
    const affiliated =
      doctor.clinic_id === clinic.id ||
      docClinicCanonical === targetClinicCanonical ||
      isAssigned ||
      (doctor.clinic_affiliations &&
        doctor.clinic_affiliations.some(
          (c) =>
            c.toLowerCase() === clinic.name.toLowerCase() ||
            c === clinic.id ||
            resolveCanonicalClinicId(c) === targetClinicCanonical
        ));
    if (!affiliated) {
      return { valid: false, code: 'CLINIC_MISMATCH', error: `Doctor ${doctor.name} is not affiliated with clinic ${clinic.name}.` };
    }

    const normalizedDate = timeService.normalizeDateString(dateStr);
    const normalizedTime = timeService.normalizeTimeString(timeStr);
    const slotMins = parseTimeToMinutes(normalizedTime);

    // Dynamic availability requests check: Must have an APPROVED request for visiting clinic
    const isPrimaryClinic = targetClinicCanonical === resolveCanonicalClinicId(doctor.clinic_id);
    const approvedRequests = await AvailabilityRequestModel.getAllApprovedForDoctorAndClinic(
      doctor.id,
      targetClinicCanonical,
      normalizedDate
    );
    const hasApproved = approvedRequests.length > 0;

    const allRequests = await AvailabilityRequestModel.getRequests({
      doctorId: doctor.id,
      clinicId: targetClinicCanonical,
      date: normalizedDate,
    });
    const hasPendingOnly =
      allRequests.length > 0 && allRequests.every((r) => r.status === 'PENDING');
    const allRejected =
      allRequests.length > 0 && allRequests.every((r) => r.status === 'REJECTED');

    if (!hasApproved) {
      return {
        valid: false,
        code: 'DOCTOR_UNAVAILABLE',
        error: `Doctor ${doctor.name} has not approved availability for ${clinic.name} on ${normalizedDate}.`,
      };
    }

    // Past date check
    if (timeService.isPastDate(normalizedDate)) {
      return { valid: false, code: 'PAST_DATE', error: 'Cannot book appointments for past dates.' };
    }

    // Past time slot check for today
    if (timeService.hasSlotPassed(normalizedDate, normalizedTime, 0)) {
      return { valid: false, code: 'PAST_SLOT', error: 'The selected time slot has already passed.' };
    }

    // Doctor schedule for date
    let schedule = await this.getDoctorScheduleForDate(doctor, normalizedDate);

    if (schedule.isOnLeave) {
      return { valid: false, code: 'DOCTOR_ON_LEAVE', error: `Doctor ${doctor.name} is on leave on ${normalizedDate}.` };
    }

    if (schedule.isEmergencyClosed) {
      return { valid: false, code: 'DOCTOR_UNAVAILABLE', error: `Clinic/doctor schedule is temporarily closed on ${normalizedDate}.` };
    }

    // Check clinic-specific live status if booking for today
    if (timeService.isToday(normalizedDate)) {
      const clinicStatus = await DoctorClinicAssignmentModel.getStatus(doctor.id, targetClinicCanonical);
      const liveStatus = clinicStatus || doctor.status;
      if (liveStatus === 'OFFLINE') {
        return {
          valid: false,
          code: 'DOCTOR_UNAVAILABLE',
          error: `Doctor ${doctor.name} is currently offline at ${clinic.name}. Immediate booking is unavailable.`,
        };
      }
      if (liveStatus === 'BUSY') {
        return {
          valid: false,
          code: 'DOCTOR_UNAVAILABLE',
          error: `Doctor ${doctor.name} is currently busy at ${clinic.name}. Immediate booking is unavailable.`,
        };
      }
    }

    const durMins = options?.consultationDurationMinutes || schedule.consultationDurationMinutes || 20;
    const slotEndMins = slotMins + durMins;

    if (hasApproved) {
      // Validate slot falls strictly within one of the approved windows
      const inAnyApprovedWindow = approvedRequests.some((r) => {
        const reqStartMins = parseTimeToMinutes(r.start_time);
        const reqEndMins = parseTimeToMinutes(r.end_time);
        return slotMins >= reqStartMins && slotEndMins <= reqEndMins;
      });

      if (!inAnyApprovedWindow) {
        const windowsStr = approvedRequests.map((r) => `${r.start_time} - ${r.end_time}`).join(', ');
        return {
          valid: false,
          code: 'OUT_OF_HOURS',
          error: `Selected slot (${normalizedTime}) is outside doctor's approved availability (${windowsStr}).`,
        };
      }
    } else {
      // Doctor working primary clinic default schedule
      if (schedule.isOffDuty) {
        return { valid: false, code: 'DOCTOR_OFF_DUTY', error: `Doctor ${doctor.name} is off-duty on ${schedule.dayName}s.` };
      }

      if (schedule.isUnavailableToday) {
        return { valid: false, code: 'DOCTOR_UNAVAILABLE', error: `Doctor ${doctor.name} is currently offline or unavailable today.` };
      }

      if (slotMins < schedule.startMinutes || slotEndMins > schedule.endMinutes) {
        return {
          valid: false,
          code: 'OUT_OF_HOURS',
          error: `Selected slot (${normalizedTime}) is outside working hours (${schedule.startTime} - ${schedule.endTime}).`,
        };
      }
    }

    // Break bounds
    for (const b of schedule.breaks) {
      if (slotMins < b.endMins && slotEndMins > b.startMins) {
        return {
          valid: false,
          code: 'SLOT_IN_BREAK',
          error: `Selected slot (${normalizedTime}) overlaps doctor's scheduled break (${b.start} - ${b.end}).`,
        };
      }
    }

    // Active appointment collision check
    for (const existing of memoryDb.appointments.values()) {
      if (options?.excludeAppointmentId && existing.id === options.excludeAppointmentId) {
        continue;
      }
      if (
        existing.doctor_id === doctor.id &&
        timeService.normalizeDateString(existing.date || existing.appointmentDate) === normalizedDate &&
        timeService.normalizeTimeString(existing.time || existing.slotStartTime) === normalizedTime &&
        !['Cancelled', 'CANCELLED', 'No Show', 'NO_SHOW', 'No-Show'].includes(existing.status)
      ) {
        return {
          valid: false,
          code: 'SLOT_NO_LONGER_AVAILABLE',
          error: 'This slot is no longer available. Please select another time slot.',
        };
      }
    }

    return {
      valid: true,
      normalizedDate,
      normalizedTime,
      doctor,
      schedule,
    };
  },
};

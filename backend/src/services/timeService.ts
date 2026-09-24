/**
 * ============================================================
 * MEDLINK CENTRALIZED CLINIC TIME & DATE SERVICE
 * ============================================================
 * Standardizes clinic timezone (Asia/Kolkata), demo simulated clock,
 * date classifications, slot timing, check-in windows, and no-show grace periods.
 */

export interface DemoClockState {
  isSimulated: boolean;
  simulatedIsoString: string | null;
  note?: string;
}

const demoClockState: DemoClockState = {
  isSimulated: false,
  simulatedIsoString: null,
  note: 'Real system clock active',
};

export const CLINIC_TIMEZONE = 'Asia/Kolkata';

export const timeService = {
  /**
   * Sets or clears simulated demo clock.
   */
  setDemoClock(isoStringOrNull: string | null, note?: string): DemoClockState {
    if (isoStringOrNull) {
      const parsed = new Date(isoStringOrNull);
      if (isNaN(parsed.getTime())) {
        throw new Error('Invalid ISO date string provided for demo clock.');
      }
      demoClockState.isSimulated = true;
      demoClockState.simulatedIsoString = parsed.toISOString();
      demoClockState.note = note || 'Simulated clock active';
    } else {
      demoClockState.isSimulated = false;
      demoClockState.simulatedIsoString = null;
      demoClockState.note = 'Real system clock active';
    }
    return { ...demoClockState };
  },

  /**
   * Gets the current demo clock state.
   */
  getDemoClockState(): DemoClockState {
    return { ...demoClockState };
  },

  /**
   * Returns the current clinic Date instance (respecting simulated clock if enabled).
   */
  getCurrentClinicDate(): Date {
    if (demoClockState.isSimulated && demoClockState.simulatedIsoString) {
      return new Date(demoClockState.simulatedIsoString);
    }
    return new Date();
  },

  /**
   * Returns current clinic date formatted as YYYY-MM-DD in Asia/Kolkata timezone.
   */
  getTodayDateString(): string {
    const d = this.getCurrentClinicDate();
    // Use Intl for reliable Asia/Kolkata date
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: CLINIC_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
    return parts; // Returns YYYY-MM-DD
  },

  /**
   * Returns current clinic time formatted as hh:mm A in Asia/Kolkata timezone.
   */
  getCurrentTimeString(): string {
    const d = this.getCurrentClinicDate();
    return new Intl.DateTimeFormat('en-US', {
      timeZone: CLINIC_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  },

  /**
   * Normalizes any input date representation to YYYY-MM-DD.
   * Handles "Today", "Tomorrow", "Aug 21, 2026", "2026-09-08", etc.
   */
  normalizeDateString(inputDate: string): string {
    if (!inputDate) return this.getTodayDateString();

    const clean = inputDate.trim();
    if (clean.toLowerCase().startsWith('today')) {
      return this.getTodayDateString();
    }
    if (clean.toLowerCase().startsWith('tomorrow')) {
      const d = this.getCurrentClinicDate();
      d.setDate(d.getDate() + 1);
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: CLINIC_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
    }

    // Check if already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return clean;
    }

    // Try parsing Date
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: CLINIC_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(parsed);
    }

    return clean;
  },

  /**
   * Normalizes any time representation to "hh:mm A" (e.g. "09:00 AM", "02:30 PM").
   */
  normalizeTimeString(inputTime: any): string {
    if (!inputTime) return '09:00 AM';
    let timeStr = typeof inputTime === 'string' ? inputTime : (inputTime.time || inputTime.time_slot || inputTime.slot || '09:00 AM');
    if (typeof timeStr !== 'string') timeStr = String(timeStr);
    const clean = timeStr.trim();
    const isPM = clean.toUpperCase().includes('PM');
    const isAM = clean.toUpperCase().includes('AM');
    const parts = clean.replace(/[^\d:]/g, '').split(':');
    let hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
  },

  /**
   * Calculates slot end time given start time and duration in minutes or string.
   */
  calculateSlotEndTime(slotStartTime: string, duration: string | number = '20 min'): string {
    const clean = (slotStartTime || '09:00 AM').toString().trim();
    const isPM = clean.toUpperCase().includes('PM');
    const isAM = clean.toUpperCase().includes('AM');
    const parts = clean.replace(/[^\d:]/g, '').split(':');
    let hours = parseInt(parts[0], 10) || 0;
    let minutes = parseInt(parts[1], 10) || 0;
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    const durMinutes = typeof duration === 'number' ? duration : (parseInt(String(duration).replace(/[^0-9]/g, ''), 10) || 20);
    const totalMinutes = hours * 60 + minutes + durMinutes;

    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    const displayHour = endHours % 12 === 0 ? 12 : endHours % 12;
    const ampm = endHours >= 12 ? 'PM' : 'AM';
    return `${String(displayHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')} ${ampm}`;
  },

  /**
   * Returns true if the appointment date corresponds to today's clinic date.
   */
  isToday(dateStr: string): boolean {
    const norm = this.normalizeDateString(dateStr);
    return norm === this.getTodayDateString();
  },

  /**
   * Returns true if the appointment date is in the future.
   */
  isFutureDate(dateStr: string): boolean {
    const norm = this.normalizeDateString(dateStr);
    return norm > this.getTodayDateString();
  },

  /**
   * Returns true if the appointment date is in the past.
   */
  isPastDate(dateStr: string): boolean {
    const norm = this.normalizeDateString(dateStr);
    return norm < this.getTodayDateString();
  },

  /**
   * Checks if an appointment's slot has passed plus a grace period in minutes.
   */
  hasSlotPassed(dateStr: string, timeStr: string, graceMinutes: number = 10): boolean {
    const normDate = this.normalizeDateString(dateStr);
    const today = this.getTodayDateString();

    if (normDate < today) return true;
    if (normDate > today) return false;

    // Same day: evaluate time + grace period
    const cleanTime = this.normalizeTimeString(timeStr);
    const isPM = cleanTime.toUpperCase().includes('PM');
    const isAM = cleanTime.toUpperCase().includes('AM');
    const parts = cleanTime.replace(/[^\d:]/g, '').split(':');
    let slotHour = parseInt(parts[0], 10) || 0;
    const slotMin = parseInt(parts[1], 10) || 0;
    if (isPM && slotHour < 12) slotHour += 12;
    if (isAM && slotHour === 12) slotHour = 0;

    const slotTotalMinutes = slotHour * 60 + slotMin + graceMinutes;

    const currentClinicDate = this.getCurrentClinicDate();
    const currentHour = currentClinicDate.getHours();
    const currentMinute = currentClinicDate.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    return currentTotalMinutes >= slotTotalMinutes;
  },

  /**
   * Checks if check-in is currently open for the appointment.
   * Window: On the same appointment date, starting windowMinutes (e.g. 30 min) before the slot.
   */
  isCheckInOpen(dateStr: string, timeStr: string, windowMinutes: number = 30): { open: boolean; message?: string } {
    const normDate = this.normalizeDateString(dateStr);
    const today = this.getTodayDateString();

    if (normDate > today) {
      return {
        open: false,
        message: `Check-in opens on ${normDate}.`,
      };
    }
    if (normDate < today) {
      return {
        open: false,
        message: 'This appointment date has already passed.',
      };
    }

    // Same day: check window
    const cleanTime = this.normalizeTimeString(timeStr);
    const isPM = cleanTime.toUpperCase().includes('PM');
    const isAM = cleanTime.toUpperCase().includes('AM');
    const parts = cleanTime.replace(/[^\d:]/g, '').split(':');
    let slotHour = parseInt(parts[0], 10) || 0;
    const slotMin = parseInt(parts[1], 10) || 0;
    if (isPM && slotHour < 12) slotHour += 12;
    if (isAM && slotHour === 12) slotHour = 0;

    const slotTotalMinutes = slotHour * 60 + slotMin;
    const openMinutes = Math.max(0, slotTotalMinutes - windowMinutes);

    const currentClinicDate = this.getCurrentClinicDate();
    const currentTotalMinutes = currentClinicDate.getHours() * 60 + currentClinicDate.getMinutes();

    if (currentTotalMinutes < openMinutes) {
      const openHour = Math.floor(openMinutes / 60) % 24;
      const openMin = openMinutes % 60;
      const displayHour = openHour % 12 === 0 ? 12 : openHour % 12;
      const ampm = openHour >= 12 ? 'PM' : 'AM';
      const openTimeStr = `${String(displayHour).padStart(2, '0')}:${String(openMin).padStart(2, '0')} ${ampm}`;
      return {
        open: false,
        message: `Check-in opens at ${openTimeStr} (30 mins before appointment).`,
      };
    }

    return { open: true };
  },

  /**
   * Checks whether cancellation is permissible by policy.
   * Policy: Not cancellable after checked in, in consultation, or completed.
   */
  isCancellationAllowed(
    status: string,
    dateStr: string,
    timeStr: string,
    cutoffMinutes: number = 60
  ): { allowed: boolean; reason?: string } {
    const normStatus = status.toUpperCase().replace(/[\s_-]+/g, '');
    if (['CHECKEDIN', 'ARRIVED'].includes(normStatus)) {
      return { allowed: false, reason: 'Cannot cancel an appointment after patient has checked in.' };
    }
    if (['INCONSULTATION', 'INSESSION'].includes(normStatus)) {
      return { allowed: false, reason: 'Cannot cancel an appointment currently in consultation.' };
    }
    if (['COMPLETED'].includes(normStatus)) {
      return { allowed: false, reason: 'Cannot cancel a completed consultation.' };
    }
    if (['CANCELLED'].includes(normStatus)) {
      return { allowed: false, reason: 'Appointment is already cancelled.' };
    }
    if (['NOSHOW'].includes(normStatus)) {
      return { allowed: false, reason: 'Cannot cancel an appointment marked as no-show.' };
    }

    // Check cutoff if same day
    const normDate = this.normalizeDateString(dateStr);
    const today = this.getTodayDateString();

    if (normDate === today) {
      const cleanTime = this.normalizeTimeString(timeStr);
      const isPM = cleanTime.toUpperCase().includes('PM');
      const isAM = cleanTime.toUpperCase().includes('AM');
      const parts = cleanTime.replace(/[^\d:]/g, '').split(':');
      let slotHour = parseInt(parts[0], 10) || 0;
      const slotMin = parseInt(parts[1], 10) || 0;
      if (isPM && slotHour < 12) slotHour += 12;
      if (isAM && slotHour === 12) slotHour = 0;

      const slotTotalMinutes = slotHour * 60 + slotMin;
      const cutoffTime = slotTotalMinutes - cutoffMinutes;

      const currentTotalMinutes = this.getCurrentClinicDate().getHours() * 60 + this.getCurrentClinicDate().getMinutes();
      if (currentTotalMinutes > cutoffTime && currentTotalMinutes >= slotTotalMinutes) {
        return {
          allowed: false,
          reason: 'Cancellation window has closed (cutoff is 1 hour prior to appointment).',
        };
      }
    }

    return { allowed: true };
  },
};

/**
 * ============================================================
 * MEDLINK CENTRALIZED REAL-TIME DATE & TIME UTILITY
 * ============================================================
 * All date and time calculations use the real system clock (new Date()).
 * Zero hardcoded dates or static time strings.
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const timeUtils = {
  /**
   * Returns current Date instance.
   */
  now(): Date {
    return new Date();
  },

  /**
   * Formats a given Date instance into YYYY-MM-DD using local clinic timezone.
   * Eliminates UTC-day-shift errors in early morning hours.
   */
  formatDateToYMD(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Returns today's date formatted as YYYY-MM-DD in local clinic timezone.
   */
  getTodayDateString(): string {
    return this.formatDateToYMD(new Date());
  },

  /**
   * Returns today's formatted date, e.g. "Aug 31, 2026".
   */
  getTodayFormatted(): string {
    const d = new Date();
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  },

  /**
   * Returns tomorrow's formatted date calculated dynamically, e.g. "Sep 01, 2026".
   */
  getTomorrowFormatted(): string {
    const d = new Date(Date.now() + 86400000);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  },

  /**
   * Returns full date with day name, e.g. "Monday, 31 August 2026".
   */
  getFullDateString(date: Date = new Date()): string {
    return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${FULL_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  },

  /**
   * Returns formatted 12-hour time string, e.g. "10:24 AM".
   */
  formatCurrentTime(): string {
    const d = new Date();
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minStr} ${ampm}`;
  },

  /**
   * Formats relative date display: "Today, Aug 31", "Tomorrow, Sep 1", or "Aug 27, 2026".
   */
  formatRelativeDate(dateStr: string): string {
    if (!dateStr) return this.getTodayFormatted();

    const todayStr = this.getTodayFormatted();
    const tomorrowStr = this.getTomorrowFormatted();

    if (dateStr.includes(todayStr) || dateStr.toLowerCase().startsWith('today')) {
      return `Today, ${MONTH_NAMES[new Date().getMonth()]} ${new Date().getDate()}`;
    }

    if (dateStr.includes(tomorrowStr) || dateStr.toLowerCase().startsWith('tomorrow')) {
      const tom = new Date(Date.now() + 86400000);
      return `Tomorrow, ${MONTH_NAMES[tom.getMonth()]} ${tom.getDate()}`;
    }

    return dateStr;
  },

  /**
   * Parses time string (e.g. "10:00 AM", "02:30 PM", "14:30") into hours & minutes.
   */
  parseTimeString(timeStr: string): { hours: number; minutes: number } {
    if (!timeStr) return { hours: 9, minutes: 0 };

    const clean = timeStr.trim();
    const isPM = clean.toUpperCase().includes('PM');
    const isAM = clean.toUpperCase().includes('AM');
    const parts = clean.replace(/[^\d:]/g, '').split(':');

    let hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return { hours, minutes };
  },

  /**
   * Calculates time remaining until an appointment or status indicator.
   */
  calculateTimeUntil(appointmentDate: string, appointmentTime: string, status: string): string {
    if (status === 'In Consultation') return 'In Consultation';
    if (status === 'Completed') return 'Completed';
    if (status === 'Cancelled') return 'Cancelled';

    const { hours, minutes } = this.parseTimeString(appointmentTime);
    const now = new Date();
    const apptDate = new Date();
    apptDate.setHours(hours, minutes, 0, 0);

    const diffMs = apptDate.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / 60000);

    if (diffMinutes > 60) {
      const diffHours = (diffMinutes / 60).toFixed(1).replace('.0', '');
      return `Starts in ${diffHours} hrs`;
    }
    if (diffMinutes > 0) {
      return `Starts in ${diffMinutes} min`;
    }
    if (diffMinutes >= -30) {
      return 'Waiting in Queue';
    }
    return 'Checked In';
  },

  /**
   * Calculates dynamic difference between two time slots (e.g. "1.5 hours earlier", "45 min earlier").
   */
  calculateTimeDifference(currentSlotTime: string, earlierSlotTime: string): string {
    const tCurrent = this.parseTimeString(currentSlotTime);
    const tEarlier = this.parseTimeString(earlierSlotTime);

    const currentMin = tCurrent.hours * 60 + tCurrent.minutes;
    const earlierMin = tEarlier.hours * 60 + tEarlier.minutes;

    const diffMin = currentMin - earlierMin;

    if (diffMin <= 0) return 'Earlier today';
    if (diffMin >= 60) {
      const hrs = (diffMin / 60).toFixed(1).replace('.0', '');
      return `${hrs} hour${hrs === '1' ? '' : 's'} earlier`;
    }
    return `${diffMin} min earlier`;
  },
};

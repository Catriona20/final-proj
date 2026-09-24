/**
 * ============================================================
 * MEDLINK CENTRALIZED REAL-TIME DATE & TIME UTILITY (DOCTOR APP)
 * ============================================================
 * All date and time calculations use the real system clock (new Date()).
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
  now(): Date {
    return new Date();
  },

  getTodayFormatted(): string {
    const d = new Date();
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  },

  getTomorrowFormatted(): string {
    const d = new Date(Date.now() + 86400000);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  },

  getFullDateString(date: Date = new Date()): string {
    return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${FULL_MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  },

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
};

import { Announcement } from '../types';
import { apiClient } from './apiClient';

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Extended OPD Timings at MetroCare',
    summary: 'MetroCare Primary Health Clinic is now open until 09:00 PM on weekdays.',
    content: 'To better accommodate working patients, MetroCare Primary Health Clinic has extended its evening general medicine and diagnostic OPD hours from 08:00 PM to 09:00 PM from Monday to Friday.',
    date: 'Aug 18, 2026',
    category: 'Clinic',
    clinicName: 'MetroCare Primary Health Clinic',
    isImportant: true,
  },
  {
    id: 'ann-2',
    title: 'Seasonal Fever Screening Camp',
    summary: 'Free preventive health checkups and seasonal vector-borne fever screening.',
    content: 'Free seasonal dengue and viral fever diagnostics screening camps are available this weekend across partner clinics in Mylapore, T. Nagar, and Adyar.',
    date: 'Aug 15, 2026',
    category: 'Health',
    isImportant: false,
    clinicName: 'MedLink Health Network',
  },
];

class AnnouncementService {
  private announcements: Announcement[] = [...INITIAL_ANNOUNCEMENTS];

  async fetchAnnouncements(): Promise<Announcement[]> {
    try {
      const res = await apiClient.get('/announcements');
      if (res.data?.announcements && res.data.announcements.length > 0) {
        this.announcements = res.data.announcements;
      }
    } catch (err) {
      // Fallback
    }
    return this.announcements;
  }

  getAnnouncements(): Announcement[] {
    return [...this.announcements];
  }

  getImportantAnnouncements(): Announcement[] {
    return this.announcements.filter((a) => a.isImportant);
  }

  getAnnouncementById(id: string): Announcement | undefined {
    return this.announcements.find((a) => a.id === id);
  }

  getAnnouncementsForChatbot(): string {
    return this.announcements
      .map((a) => `• [${a.category}] ${a.title}: ${a.summary} (${a.date})`)
      .join('\n');
  }
}

export const announcementService = new AnnouncementService();

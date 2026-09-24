import { dbStore } from '../db/database.js';
import { WalkIn } from '../types/index.js';
import { QueueService } from './queueService.js';

export class WalkInService {
  public static getWalkIns(): WalkIn[] {
    return dbStore.walkIns;
  }

  public static addWalkIn(data: {
    patientName: string;
    phone: string;
    reason: string;
    preferredDoctor: string;
    priority?: 'NORMAL' | 'URGENT' | 'EMERGENCY';
    addToQueueAuto?: boolean;
  }): { walkIn: WalkIn; queueEntry?: any } {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const registeredAt = `${formattedHours}:${formattedMinutes} ${ampm}`;

    const newWalkIn: WalkIn = {
      id: `w-${Date.now()}`,
      patientName: data.patientName,
      phone: data.phone,
      reason: data.reason,
      preferredDoctor: data.preferredDoctor,
      registeredAt,
      status: 'WAITING',
      priority: data.priority || 'NORMAL',
    };

    dbStore.walkIns.push(newWalkIn);

    let queueEntry;
    if (data.addToQueueAuto !== false) {
      queueEntry = QueueService.addToQueue({
        patientName: data.patientName,
        doctorName: data.preferredDoctor,
        priority: data.priority || 'NORMAL',
        walkInId: newWalkIn.id,
      });
    }

    return { walkIn: newWalkIn, queueEntry };
  }
}

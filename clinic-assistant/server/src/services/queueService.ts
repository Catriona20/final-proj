import { dbStore } from '../db/database.js';
import { QueueEntry, QueuePriority } from '../types/index.js';

export class QueueService {
  /**
   * Retrieves the current waiting queue.
   * NOTE FOR MODULE 2+: This is where priority sorting / min-heap scheduling algorithms
   * will be integrated to dynamically order queue entries based on priority, wait times, and doctor availability.
   */
  public static getQueue(): QueueEntry[] {
    return dbStore.queueEntries;
  }

  public static addToQueue(data: {
    patientName: string;
    doctorName: string;
    priority?: QueuePriority;
    appointmentId?: string;
    walkInId?: string;
    estimatedWait?: number;
  }): QueueEntry {
    const priority = data.priority || 'NORMAL';
    const prefix = priority === 'EMERGENCY' ? 'E' : priority === 'URGENT' ? 'U' : 'A';
    const queueNumber = `${prefix}${String(dbStore.queueEntries.length + 1).padStart(3, '0')}`;

    const newEntry: QueueEntry = {
      id: `q-${Date.now()}`,
      queueNumber,
      patientName: data.patientName,
      doctorName: data.doctorName,
      priority,
      waitingTime: 0,
      estimatedWait: data.estimatedWait !== undefined ? data.estimatedWait : priority === 'EMERGENCY' ? 0 : 15,
      status: 'WAITING',
      appointmentId: data.appointmentId,
      walkInId: data.walkInId,
      addedAt: new Date().toISOString(),
    };

    // If emergency, insert at the front of waiting queue, otherwise append
    if (priority === 'EMERGENCY') {
      dbStore.queueEntries.unshift(newEntry);
    } else {
      dbStore.queueEntries.push(newEntry);
    }

    return newEntry;
  }

  public static updateQueueStatus(
    id: string,
    status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED'
  ): QueueEntry | null {
    const entry = dbStore.queueEntries.find((q) => q.id === id);
    if (!entry) return null;
    entry.status = status;
    return entry;
  }
}

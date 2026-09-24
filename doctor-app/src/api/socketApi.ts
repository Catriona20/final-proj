import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from './apiClient';

let socket: Socket | null = null;

export const initDoctorSocket = (
  doctorId: string,
  clinicId?: string,
  callbacks?: {
    onQueueUpdated?: (data: any) => void;
    onAppointmentStatus?: (data: any) => void;
    onAppointmentCreated?: (data: any) => void;
    onAvailabilityChanged?: (data: any) => void;
    onDelayUpdated?: (data: any) => void;
    onNotification?: (data: any) => void;
    onAvailabilityRequestNew?: (data: any) => void;
    onAvailabilityRequestApproved?: (data: any) => void;
    onAvailabilityRequestRejected?: (data: any) => void;
  }
): Socket => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log(`🔌 [Doctor App] WebSocket connected to ${SOCKET_URL} (ID: ${socket?.id})`);

    // Join doctor's personal room
    if (doctorId) {
      socket?.emit('join:doctor', doctorId);
    }

    // Join clinic room
    if (clinicId) {
      socket?.emit('join:clinic', clinicId);
    }
  });

  if (callbacks?.onQueueUpdated) {
    socket.on('queue:updated', callbacks.onQueueUpdated);
    socket.on('queue:completed', callbacks.onQueueUpdated);
    socket.on('appointment:cancelled', callbacks.onQueueUpdated);
    socket.on('appointment:rescheduled', callbacks.onQueueUpdated);
  }

  if (callbacks?.onAppointmentStatus) {
    socket.on('appointment:status', callbacks.onAppointmentStatus);
    socket.on('appointment:cancelled', callbacks.onAppointmentStatus);
    socket.on('appointment:rescheduled', callbacks.onAppointmentStatus);
  }

  if (callbacks?.onAppointmentCreated) {
    socket.on('appointment:created', callbacks.onAppointmentCreated);
  }

  if (callbacks?.onAvailabilityChanged) {
    socket.on('doctor:availability_changed', callbacks.onAvailabilityChanged);
    socket.on('doctor:availability_updated', callbacks.onAvailabilityChanged);
  }

  if (callbacks?.onDelayUpdated) {
    socket.on('doctor:delay_updated', callbacks.onDelayUpdated);
  }

  if (callbacks?.onNotification) {
    socket.on('notification:new', callbacks.onNotification);
  }

  if (callbacks?.onAvailabilityRequestNew) {
    socket.on('availability_request:new', callbacks.onAvailabilityRequestNew);
  }

  if (callbacks?.onAvailabilityRequestApproved) {
    socket.on('availability_request:approved', callbacks.onAvailabilityRequestApproved);
  }

  if (callbacks?.onAvailabilityRequestRejected) {
    socket.on('availability_request:rejected', callbacks.onAvailabilityRequestRejected);
  }

  socket.on('disconnect', () => {
    console.log('🔌 [Doctor App] WebSocket disconnected');
  });

  return socket;
};

export const disconnectDoctorSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getDoctorSocket = (): Socket | null => socket;

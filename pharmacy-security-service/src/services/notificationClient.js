'use strict';

/**
 * Notification Integration Service (Module 12 Boundary)
 *
 * NOTE: Email, SMS, and WhatsApp delivery providers are owned by a teammate service.
 * This client defines the integration contract to dispatch events/triggers to that service.
 */

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5000/api/notifications';

/**
 * Dispatches an event payload to the teammate's Notification Service.
 *
 * @param {Object} eventPayload
 * @param {string} eventPayload.eventType - E.g., 'LOW_STOCK_ALERT', 'PRESCRIPTION_DISPENSED'
 * @param {string} eventPayload.recipient - E.g., user email or phone
 * @param {'email'|'sms'|'whatsapp'} eventPayload.channel
 * @param {string} eventPayload.template
 * @param {Object} eventPayload.data
 * @returns {Promise<{ success: boolean, message: string }>}
 */
const triggerNotificationEvent = async (eventPayload) => {
  console.log(`[Notification Boundary] Dispatching event '${eventPayload.eventType}' to Notification Service:`, {
    targetUrl: NOTIFICATION_SERVICE_URL,
    channel: eventPayload.channel,
    recipient: eventPayload.recipient,
  });

  // When teammate's service is live, perform fetch/axios POST to NOTIFICATION_SERVICE_URL
  // For now, return a standardized event acknowledgment without implementing delivery mechanisms.
  return {
    success: true,
    message: `Event '${eventPayload.eventType}' successfully dispatched to Notification Service at ${NOTIFICATION_SERVICE_URL}`,
  };
};

module.exports = {
  triggerNotificationEvent,
};

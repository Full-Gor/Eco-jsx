/**
 * Notification Provider exports
 */

export type {
  INotificationProvider,
  Notification,
  NotificationPriority,
  NotificationPermissionStatus,
  SendNotificationOptions,
  SendToUserOptions,
  SendToTopicOptions,
  SendToTokenOptions,
  NotificationReceivedCallback,
  NotificationInteractionCallback,
  PushTokenCallback,
  NotificationProviderOptions,
} from './NotificationProvider.interface';

export { createNtfyNotificationProvider } from './NtfyNotificationProvider';
export type { NtfyConfig } from './NtfyNotificationProvider';

export { createFCMNotificationProvider } from './FCMNotificationProvider';
export type { FCMConfig } from './FCMNotificationProvider';

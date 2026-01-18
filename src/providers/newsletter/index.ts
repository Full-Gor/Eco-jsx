/**
 * Newsletter Provider exports
 */

export type {
  INewsletterProvider,
  NewsletterSubscriber,
  SubscriberStatus,
  SubscribeOptions,
  UnsubscribeOptions,
  NewsletterCampaign,
  CampaignStatus,
  CampaignStats,
  SendCampaignOptions,
  NewsletterProviderOptions,
} from './NewsletterProvider.interface';

export { createListmonkNewsletterProvider } from './ListmonkNewsletterProvider';
export type { ListmonkConfig } from './ListmonkNewsletterProvider';

export { createBrevoNewsletterProvider } from './BrevoNewsletterProvider';
export type { BrevoConfig } from './BrevoNewsletterProvider';

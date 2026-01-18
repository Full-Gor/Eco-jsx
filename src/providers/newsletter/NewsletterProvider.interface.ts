/**
 * Newsletter Provider Interface
 * Defines the contract for all newsletter providers
 */

import { ApiResponse } from '../../types/common';
import { BaseProvider } from '../types';

/** Newsletter subscriber */
export interface NewsletterSubscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: SubscriberStatus;
  lists: string[];
  tags?: string[];
  subscribedAt: Date | string;
  unsubscribedAt?: Date | string;
  metadata?: Record<string, unknown>;
}

/** Subscriber status */
export type SubscriberStatus =
  | 'subscribed'
  | 'unsubscribed'
  | 'pending'
  | 'bounced'
  | 'complained';

/** Subscribe options */
export interface SubscribeOptions {
  email: string;
  firstName?: string;
  lastName?: string;
  listId?: string | number;
  tags?: string[];
  doubleOptIn?: boolean;
  metadata?: Record<string, unknown>;
}

/** Unsubscribe options */
export interface UnsubscribeOptions {
  email: string;
  listId?: string | number;
}

/** Campaign */
export interface NewsletterCampaign {
  id: string;
  name: string;
  subject: string;
  status: CampaignStatus;
  listId: string | number;
  templateId?: string;
  sentAt?: Date | string;
  scheduledAt?: Date | string;
  stats?: CampaignStats;
}

/** Campaign status */
export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'cancelled';

/** Campaign stats */
export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  complained: number;
  openRate: number;
  clickRate: number;
}

/** Send campaign options */
export interface SendCampaignOptions {
  name: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  listId: string | number;
  scheduledAt?: Date | string;
  tags?: string[];
}

/** Newsletter provider interface */
export interface INewsletterProvider extends BaseProvider {
  /**
   * Subscribe an email to the newsletter
   * @param options - Subscribe options
   * @returns Promise with subscriber data
   */
  subscribe(options: SubscribeOptions): Promise<ApiResponse<NewsletterSubscriber>>;

  /**
   * Unsubscribe an email from the newsletter
   * @param options - Unsubscribe options
   * @returns Promise with success status
   */
  unsubscribe(options: UnsubscribeOptions): Promise<ApiResponse<void>>;

  /**
   * Get subscriber by email
   * @param email - Subscriber email
   * @returns Promise with subscriber data
   */
  getSubscriber(email: string): Promise<ApiResponse<NewsletterSubscriber | null>>;

  /**
   * Update subscriber data
   * @param email - Subscriber email
   * @param data - Update data
   * @returns Promise with updated subscriber
   */
  updateSubscriber(
    email: string,
    data: Partial<NewsletterSubscriber>
  ): Promise<ApiResponse<NewsletterSubscriber>>;

  /**
   * Check if email is subscribed
   * @param email - Email to check
   * @returns Promise with subscription status
   */
  isSubscribed(email: string): Promise<ApiResponse<boolean>>;

  /**
   * Get all lists
   * @returns Promise with array of list IDs/names
   */
  getLists(): Promise<ApiResponse<Array<{ id: string | number; name: string }>>>;

  /**
   * Add tags to subscriber
   * @param email - Subscriber email
   * @param tags - Tags to add
   * @returns Promise with success status
   */
  addTags(email: string, tags: string[]): Promise<ApiResponse<void>>;

  /**
   * Remove tags from subscriber
   * @param email - Subscriber email
   * @param tags - Tags to remove
   * @returns Promise with success status
   */
  removeTags(email: string, tags: string[]): Promise<ApiResponse<void>>;

  /**
   * Create and send a campaign
   * @param options - Campaign options
   * @returns Promise with campaign data
   */
  sendCampaign(options: SendCampaignOptions): Promise<ApiResponse<NewsletterCampaign>>;

  /**
   * Get campaign by ID
   * @param campaignId - Campaign ID
   * @returns Promise with campaign data
   */
  getCampaign(campaignId: string): Promise<ApiResponse<NewsletterCampaign>>;

  /**
   * Get campaign stats
   * @param campaignId - Campaign ID
   * @returns Promise with campaign stats
   */
  getCampaignStats(campaignId: string): Promise<ApiResponse<CampaignStats>>;

  /**
   * Cancel a scheduled campaign
   * @param campaignId - Campaign ID
   * @returns Promise with success status
   */
  cancelCampaign(campaignId: string): Promise<ApiResponse<void>>;

  /**
   * Send transactional email
   * @param to - Recipient email
   * @param templateId - Template ID
   * @param data - Template data
   * @returns Promise with success status
   */
  sendTransactional?(
    to: string,
    templateId: string,
    data: Record<string, unknown>
  ): Promise<ApiResponse<void>>;
}

/** Newsletter provider options */
export interface NewsletterProviderOptions {
  /** Default list ID */
  defaultListId?: string | number;

  /** Enable double opt-in */
  doubleOptIn?: boolean;

  /** Sender email */
  senderEmail?: string;

  /** Sender name */
  senderName?: string;
}

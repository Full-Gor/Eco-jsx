/**
 * Brevo (ex-Sendinblue) Newsletter Provider
 * Email marketing platform with free tier
 * https://www.brevo.com/
 */

import { ApiResponse } from '../../types/common';
import { BaseProvider } from '../types';
import {
  INewsletterProvider,
  NewsletterSubscriber,
  SubscriberStatus,
  SubscribeOptions,
  UnsubscribeOptions,
  NewsletterCampaign,
  CampaignStats,
  SendCampaignOptions,
} from './NewsletterProvider.interface';

/** Brevo configuration */
export interface BrevoConfig {
  /** Brevo API key */
  apiKey: string;
  /** Default list ID */
  defaultListId?: number;
  /** Sender email */
  senderEmail?: string;
  /** Sender name */
  senderName?: string;
  /** Enable double opt-in */
  doubleOptIn?: boolean;
  /** Enable debug logging */
  debug?: boolean;
}

const BREVO_API_URL = 'https://api.brevo.com/v3';

/** Brevo contact response */
interface BrevoContact {
  id: number;
  email: string;
  emailBlacklisted: boolean;
  smsBlacklisted: boolean;
  createdAt: string;
  modifiedAt: string;
  listIds: number[];
  listUnsubscribed: number[];
  attributes: {
    FIRSTNAME?: string;
    LASTNAME?: string;
    [key: string]: unknown;
  };
}

/** Brevo campaign response */
interface BrevoCampaign {
  id: number;
  name: string;
  subject: string;
  status: 'draft' | 'sent' | 'archive' | 'queued' | 'suspended' | 'in_process';
  scheduledAt?: string;
  sentDate?: string;
  createdAt: string;
  recipients: { lists: number[] };
  statistics?: {
    globalStats: {
      sent: number;
      delivered: number;
      uniqueViews: number;
      uniqueClicks: number;
      softBounces: number;
      hardBounces: number;
      unsubscriptions: number;
      complaints: number;
    };
  };
}

/** Create Brevo newsletter provider */
export function createBrevoNewsletterProvider(config: BrevoConfig): INewsletterProvider {
  const log = (...args: unknown[]) => {
    if (config.debug) {
      console.log('[BrevoProvider]', ...args);
    }
  };

  /** Make API request */
  const apiRequest = async <T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<T> => {
    const url = `${BREVO_API_URL}${endpoint}`;
    log(`${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  };

  /** Convert Brevo contact to our format */
  const toSubscriber = (contact: BrevoContact): NewsletterSubscriber => {
    let status: SubscriberStatus = 'subscribed';
    if (contact.emailBlacklisted) {
      status = 'unsubscribed';
    }

    return {
      id: String(contact.id),
      email: contact.email,
      firstName: contact.attributes.FIRSTNAME as string,
      lastName: contact.attributes.LASTNAME as string,
      status,
      lists: contact.listIds.map(String),
      subscribedAt: contact.createdAt,
      metadata: contact.attributes,
    };
  };

  /** Convert Brevo campaign to our format */
  const toCampaign = (camp: BrevoCampaign): NewsletterCampaign => {
    const statusMap: Record<string, NewsletterCampaign['status']> = {
      draft: 'draft',
      queued: 'scheduled',
      in_process: 'sending',
      sent: 'sent',
      archive: 'sent',
      suspended: 'cancelled',
    };

    return {
      id: String(camp.id),
      name: camp.name,
      subject: camp.subject,
      status: statusMap[camp.status] || 'draft',
      listId: camp.recipients.lists[0] || config.defaultListId || 0,
      scheduledAt: camp.scheduledAt,
      sentAt: camp.sentDate,
    };
  };

  let isInitialized = false;

  const provider: INewsletterProvider = {
    name: 'brevo',
    type: 'newsletter',

    isReady(): boolean {
      return isInitialized;
    },

    async initialize(): Promise<void> {
      log('Initializing Brevo provider');
      // Test API key
      await apiRequest('/account');
      isInitialized = true;
      log('Brevo provider initialized');
    },

    async dispose(): Promise<void> {
      isInitialized = false;
      log('Brevo provider disposed');
    },

    async subscribe(options: SubscribeOptions): Promise<ApiResponse<NewsletterSubscriber>> {
      try {
        const listId = options.listId || config.defaultListId;

        const payload: Record<string, unknown> = {
          email: options.email,
          attributes: {
            FIRSTNAME: options.firstName,
            LASTNAME: options.lastName,
            ...options.metadata,
          },
          updateEnabled: true,
        };

        if (listId) {
          payload.listIds = [Number(listId)];
        }

        if (config.doubleOptIn && options.doubleOptIn !== false) {
          // Use DOI flow
          await apiRequest('/contacts/doubleOptinConfirmation', 'POST', {
            ...payload,
            includeListIds: payload.listIds,
            templateId: config.doubleOptIn, // Template ID for DOI email
            redirectionUrl: options.metadata?.redirectUrl,
          });
        } else {
          await apiRequest('/contacts', 'POST', payload);
        }

        // Get the created contact
        const contact = await this.getSubscriber(options.email);
        if (contact.success && contact.data) {
          return { success: true, data: contact.data };
        }

        // Return minimal data if we can't fetch
        return {
          success: true,
          data: {
            id: '',
            email: options.email,
            firstName: options.firstName,
            lastName: options.lastName,
            status: config.doubleOptIn ? 'pending' : 'subscribed',
            lists: listId ? [String(listId)] : [],
            subscribedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: { code: 'SUBSCRIBE_FAILED', message: String(error) },
        };
      }
    },

    async unsubscribe(options: UnsubscribeOptions): Promise<ApiResponse<void>> {
      try {
        if (options.listId) {
          // Remove from specific list
          await apiRequest(
            `/contacts/lists/${options.listId}/contacts/remove`,
            'POST',
            { emails: [options.email] }
          );
        } else {
          // Blacklist the contact
          await apiRequest(`/contacts/${encodeURIComponent(options.email)}`, 'PUT', {
            emailBlacklisted: true,
          });
        }

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'UNSUBSCRIBE_FAILED', message: String(error) },
        };
      }
    },

    async getSubscriber(email: string): Promise<ApiResponse<NewsletterSubscriber | null>> {
      try {
        const contact = await apiRequest<BrevoContact>(
          `/contacts/${encodeURIComponent(email)}`
        );
        return { success: true, data: toSubscriber(contact) };
      } catch (error) {
        if (String(error).includes('404') || String(error).includes('not found')) {
          return { success: true, data: null };
        }
        return {
          success: false,
          error: { code: 'GET_FAILED', message: String(error) },
        };
      }
    },

    async updateSubscriber(
      email: string,
      data: Partial<NewsletterSubscriber>
    ): Promise<ApiResponse<NewsletterSubscriber>> {
      try {
        const updatePayload: Record<string, unknown> = {
          attributes: {},
        };

        if (data.firstName) {
          (updatePayload.attributes as Record<string, unknown>).FIRSTNAME = data.firstName;
        }
        if (data.lastName) {
          (updatePayload.attributes as Record<string, unknown>).LASTNAME = data.lastName;
        }
        if (data.metadata) {
          Object.assign(updatePayload.attributes as Record<string, unknown>, data.metadata);
        }

        await apiRequest(`/contacts/${encodeURIComponent(email)}`, 'PUT', updatePayload);

        const updated = await this.getSubscriber(email);
        if (updated.success && updated.data) {
          return { success: true, data: updated.data };
        }

        return {
          success: false,
          error: { code: 'UPDATE_FAILED', message: 'Could not fetch updated subscriber' },
        };
      } catch (error) {
        return {
          success: false,
          error: { code: 'UPDATE_FAILED', message: String(error) },
        };
      }
    },

    async isSubscribed(email: string): Promise<ApiResponse<boolean>> {
      const result = await this.getSubscriber(email);
      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }
      const subscriber = result.data;
      const isActive =
        subscriber != null &&
        (subscriber.status === 'subscribed' || subscriber.status === 'pending');
      return { success: true, data: isActive };
    },

    async getLists(): Promise<ApiResponse<Array<{ id: string | number; name: string }>>> {
      try {
        const response = await apiRequest<{
          lists: Array<{ id: number; name: string }>;
        }>('/contacts/lists?limit=50');

        return {
          success: true,
          data: response.lists.map((l) => ({ id: l.id, name: l.name })),
        };
      } catch (error) {
        return {
          success: false,
          error: { code: 'GET_LISTS_FAILED', message: String(error) },
        };
      }
    },

    async addTags(email: string, tags: string[]): Promise<ApiResponse<void>> {
      // Brevo doesn't have tags in the same way, but we can use attributes
      try {
        const existing = await this.getSubscriber(email);
        if (!existing.success || !existing.data) {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Subscriber not found' },
          };
        }

        const currentTags = ((existing.data.metadata?.TAGS as string) || '').split(',').filter(Boolean);
        const newTags = [...new Set([...currentTags, ...tags])];

        await apiRequest(`/contacts/${encodeURIComponent(email)}`, 'PUT', {
          attributes: { TAGS: newTags.join(',') },
        });

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'ADD_TAGS_FAILED', message: String(error) },
        };
      }
    },

    async removeTags(email: string, tags: string[]): Promise<ApiResponse<void>> {
      try {
        const existing = await this.getSubscriber(email);
        if (!existing.success || !existing.data) {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Subscriber not found' },
          };
        }

        const currentTags = ((existing.data.metadata?.TAGS as string) || '').split(',').filter(Boolean);
        const newTags = currentTags.filter((t) => !tags.includes(t));

        await apiRequest(`/contacts/${encodeURIComponent(email)}`, 'PUT', {
          attributes: { TAGS: newTags.join(',') },
        });

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'REMOVE_TAGS_FAILED', message: String(error) },
        };
      }
    },

    async sendCampaign(options: SendCampaignOptions): Promise<ApiResponse<NewsletterCampaign>> {
      try {
        // Create campaign
        const campaign = await apiRequest<{ id: number }>('/emailCampaigns', 'POST', {
          name: options.name,
          subject: options.subject,
          sender: {
            email: config.senderEmail,
            name: config.senderName,
          },
          recipients: {
            listIds: [Number(options.listId)],
          },
          htmlContent: options.htmlContent,
          textContent: options.textContent,
          scheduledAt: options.scheduledAt,
          tag: options.tags?.join(','),
        });

        // Send or schedule the campaign
        if (!options.scheduledAt) {
          await apiRequest(`/emailCampaigns/${campaign.id}/sendNow`, 'POST');
        }

        // Fetch the created campaign
        const created = await this.getCampaign(String(campaign.id));
        if (created.success && created.data) {
          return { success: true, data: created.data };
        }

        return {
          success: true,
          data: {
            id: String(campaign.id),
            name: options.name,
            subject: options.subject,
            status: options.scheduledAt ? 'scheduled' : 'sending',
            listId: options.listId,
            scheduledAt: options.scheduledAt?.toString(),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: { code: 'SEND_CAMPAIGN_FAILED', message: String(error) },
        };
      }
    },

    async getCampaign(campaignId: string): Promise<ApiResponse<NewsletterCampaign>> {
      try {
        const campaign = await apiRequest<BrevoCampaign>(`/emailCampaigns/${campaignId}`);
        return { success: true, data: toCampaign(campaign) };
      } catch (error) {
        return {
          success: false,
          error: { code: 'GET_CAMPAIGN_FAILED', message: String(error) },
        };
      }
    },

    async getCampaignStats(campaignId: string): Promise<ApiResponse<CampaignStats>> {
      try {
        const campaign = await apiRequest<BrevoCampaign>(`/emailCampaigns/${campaignId}`);
        const stats = campaign.statistics?.globalStats;

        if (!stats) {
          return {
            success: true,
            data: {
              sent: 0,
              delivered: 0,
              opened: 0,
              clicked: 0,
              bounced: 0,
              unsubscribed: 0,
              complained: 0,
              openRate: 0,
              clickRate: 0,
            },
          };
        }

        return {
          success: true,
          data: {
            sent: stats.sent,
            delivered: stats.delivered,
            opened: stats.uniqueViews,
            clicked: stats.uniqueClicks,
            bounced: stats.softBounces + stats.hardBounces,
            unsubscribed: stats.unsubscriptions,
            complained: stats.complaints,
            openRate: stats.delivered ? (stats.uniqueViews / stats.delivered) * 100 : 0,
            clickRate: stats.delivered ? (stats.uniqueClicks / stats.delivered) * 100 : 0,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: { code: 'GET_STATS_FAILED', message: String(error) },
        };
      }
    },

    async cancelCampaign(campaignId: string): Promise<ApiResponse<void>> {
      try {
        await apiRequest(`/emailCampaigns/${campaignId}/status`, 'PUT', {
          status: 'suspended',
        });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'CANCEL_FAILED', message: String(error) },
        };
      }
    },

    async sendTransactional(
      to: string,
      templateId: string,
      data: Record<string, unknown>
    ): Promise<ApiResponse<void>> {
      try {
        await apiRequest('/smtp/email', 'POST', {
          to: [{ email: to }],
          templateId: Number(templateId),
          params: data,
        });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'SEND_TRANSACTIONAL_FAILED', message: String(error) },
        };
      }
    },
  };

  return provider;
}

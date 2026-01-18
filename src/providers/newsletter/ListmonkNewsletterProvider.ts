/**
 * Listmonk Newsletter Provider
 * Self-hosted newsletter and mailing list manager
 * https://listmonk.app/
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

/** Listmonk configuration */
export interface ListmonkConfig {
  /** Listmonk server URL */
  serverUrl: string;
  /** Admin username */
  username: string;
  /** Admin password */
  password: string;
  /** Default list ID */
  defaultListId?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/** Listmonk subscriber response */
interface ListmonkSubscriber {
  id: number;
  uuid: string;
  email: string;
  name: string;
  status: 'enabled' | 'disabled' | 'blocklisted';
  lists: Array<{
    id: number;
    name: string;
    uuid: string;
    subscription_status: 'unconfirmed' | 'confirmed' | 'unsubscribed';
  }>;
  attribs: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Listmonk campaign response */
interface ListmonkCampaign {
  id: number;
  uuid: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'cancelled' | 'finished';
  lists: Array<{ id: number; name: string }>;
  template_id: number;
  send_at?: string;
  started_at?: string;
  created_at: string;
  updated_at: string;
}

/** Create Listmonk newsletter provider */
export function createListmonkNewsletterProvider(config: ListmonkConfig): INewsletterProvider {
  const log = (...args: unknown[]) => {
    if (config.debug) {
      console.log('[ListmonkProvider]', ...args);
    }
  };

  /** Get auth header */
  const getAuthHeader = (): string => {
    const credentials = btoa(`${config.username}:${config.password}`);
    return `Basic ${credentials}`;
  };

  /** Make API request */
  const apiRequest = async <T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<T> => {
    const url = `${config.serverUrl}/api${endpoint}`;
    log(`${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  };

  /** Convert Listmonk subscriber to our format */
  const toSubscriber = (sub: ListmonkSubscriber): NewsletterSubscriber => {
    let status: SubscriberStatus = 'subscribed';
    if (sub.status === 'disabled' || sub.status === 'blocklisted') {
      status = 'unsubscribed';
    } else if (sub.lists.some((l) => l.subscription_status === 'unconfirmed')) {
      status = 'pending';
    }

    return {
      id: String(sub.id),
      email: sub.email,
      firstName: sub.name?.split(' ')[0],
      lastName: sub.name?.split(' ').slice(1).join(' '),
      status,
      lists: sub.lists.map((l) => String(l.id)),
      subscribedAt: sub.created_at,
      metadata: sub.attribs,
    };
  };

  /** Convert Listmonk campaign to our format */
  const toCampaign = (camp: ListmonkCampaign): NewsletterCampaign => {
    const statusMap: Record<string, NewsletterCampaign['status']> = {
      draft: 'draft',
      scheduled: 'scheduled',
      running: 'sending',
      paused: 'draft',
      cancelled: 'cancelled',
      finished: 'sent',
    };

    return {
      id: String(camp.id),
      name: camp.name,
      subject: camp.subject,
      status: statusMap[camp.status] || 'draft',
      listId: camp.lists[0]?.id || config.defaultListId || 0,
      scheduledAt: camp.send_at,
      sentAt: camp.started_at,
    };
  };

  let isInitialized = false;

  const provider: INewsletterProvider = {
    name: 'listmonk',
    type: 'newsletter',

    isReady(): boolean {
      return isInitialized;
    },

    async initialize(): Promise<void> {
      log('Initializing Listmonk provider');
      // Test connection
      await apiRequest('/health');
      isInitialized = true;
      log('Listmonk provider initialized');
    },

    async dispose(): Promise<void> {
      isInitialized = false;
      log('Listmonk provider disposed');
    },

    async subscribe(options: SubscribeOptions): Promise<ApiResponse<NewsletterSubscriber>> {
      try {
        const listId = options.listId || config.defaultListId;
        if (!listId) {
          return {
            success: false,
            error: { code: 'NO_LIST', message: 'No list ID provided' },
          };
        }

        // Create subscriber
        const subscriber = await apiRequest<ListmonkSubscriber>('/subscribers', 'POST', {
          email: options.email,
          name: [options.firstName, options.lastName].filter(Boolean).join(' ') || undefined,
          status: 'enabled',
          lists: [Number(listId)],
          attribs: options.metadata || {},
          preconfirm_subscriptions: !options.doubleOptIn,
        });

        return { success: true, data: toSubscriber(subscriber) };
      } catch (error) {
        // Check if subscriber already exists
        if (String(error).includes('already exists')) {
          // Get existing subscriber and add to list
          const existing = await this.getSubscriber(options.email);
          if (existing.success && existing.data) {
            return { success: true, data: existing.data };
          }
        }
        return {
          success: false,
          error: { code: 'SUBSCRIBE_FAILED', message: String(error) },
        };
      }
    },

    async unsubscribe(options: UnsubscribeOptions): Promise<ApiResponse<void>> {
      try {
        // Find subscriber by email
        const subscribers = await apiRequest<{ results: ListmonkSubscriber[] }>(
          `/subscribers?query=email='${encodeURIComponent(options.email)}'`
        );

        const subscriber = subscribers.results?.[0];
        if (!subscriber) {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Subscriber not found' },
          };
        }

        if (options.listId) {
          // Unsubscribe from specific list
          await apiRequest(`/subscribers/lists`, 'PUT', {
            ids: [subscriber.id],
            action: 'unsubscribe',
            target_list_ids: [Number(options.listId)],
          });
        } else {
          // Disable subscriber entirely
          await apiRequest(`/subscribers/${subscriber.id}`, 'PUT', {
            status: 'disabled',
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
        const subscribers = await apiRequest<{ results: ListmonkSubscriber[] }>(
          `/subscribers?query=email='${encodeURIComponent(email)}'`
        );

        const subscriber = subscribers.results?.[0];
        if (!subscriber) {
          return { success: true, data: null };
        }

        return { success: true, data: toSubscriber(subscriber) };
      } catch (error) {
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
        // Find subscriber
        const existing = await this.getSubscriber(email);
        if (!existing.success || !existing.data) {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Subscriber not found' },
          };
        }

        const updatePayload: Record<string, unknown> = {};
        if (data.firstName || data.lastName) {
          updatePayload.name = [data.firstName, data.lastName].filter(Boolean).join(' ');
        }
        if (data.metadata) {
          updatePayload.attribs = data.metadata;
        }

        const updated = await apiRequest<ListmonkSubscriber>(
          `/subscribers/${existing.data.id}`,
          'PUT',
          updatePayload
        );

        return { success: true, data: toSubscriber(updated) };
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
        const lists = await apiRequest<{
          results: Array<{ id: number; name: string; uuid: string }>;
        }>('/lists');

        return {
          success: true,
          data: lists.results.map((l) => ({ id: l.id, name: l.name })),
        };
      } catch (error) {
        return {
          success: false,
          error: { code: 'GET_LISTS_FAILED', message: String(error) },
        };
      }
    },

    async addTags(email: string, tags: string[]): Promise<ApiResponse<void>> {
      try {
        const existing = await this.getSubscriber(email);
        if (!existing.success || !existing.data) {
          return {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Subscriber not found' },
          };
        }

        const currentTags = (existing.data.tags || []) as string[];
        const newTags = [...new Set([...currentTags, ...tags])];

        await apiRequest(`/subscribers/${existing.data.id}`, 'PUT', {
          attribs: { ...existing.data.metadata, tags: newTags },
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

        const currentTags = (existing.data.tags || []) as string[];
        const newTags = currentTags.filter((t) => !tags.includes(t));

        await apiRequest(`/subscribers/${existing.data.id}`, 'PUT', {
          attribs: { ...existing.data.metadata, tags: newTags },
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
        const campaign = await apiRequest<ListmonkCampaign>('/campaigns', 'POST', {
          name: options.name,
          subject: options.subject,
          lists: [Number(options.listId)],
          type: 'regular',
          content_type: 'richtext',
          body: options.htmlContent || options.textContent || '',
          altbody: options.textContent,
          template_id: options.templateId ? Number(options.templateId) : undefined,
          send_at: options.scheduledAt,
          tags: options.tags,
        });

        // Start campaign if not scheduled
        if (!options.scheduledAt) {
          await apiRequest(`/campaigns/${campaign.id}/status`, 'PUT', {
            status: 'running',
          });
        }

        return { success: true, data: toCampaign(campaign) };
      } catch (error) {
        return {
          success: false,
          error: { code: 'SEND_CAMPAIGN_FAILED', message: String(error) },
        };
      }
    },

    async getCampaign(campaignId: string): Promise<ApiResponse<NewsletterCampaign>> {
      try {
        const campaign = await apiRequest<ListmonkCampaign>(`/campaigns/${campaignId}`);
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
        const campaign = await apiRequest<
          ListmonkCampaign & {
            stats: {
              sent: number;
              views: number;
              clicks: number;
              bounces: number;
            };
          }
        >(`/campaigns/${campaignId}`);

        const stats: CampaignStats = {
          sent: campaign.stats?.sent || 0,
          delivered: campaign.stats?.sent || 0,
          opened: campaign.stats?.views || 0,
          clicked: campaign.stats?.clicks || 0,
          bounced: campaign.stats?.bounces || 0,
          unsubscribed: 0,
          complained: 0,
          openRate: campaign.stats?.sent
            ? (campaign.stats.views / campaign.stats.sent) * 100
            : 0,
          clickRate: campaign.stats?.sent
            ? (campaign.stats.clicks / campaign.stats.sent) * 100
            : 0,
        };

        return { success: true, data: stats };
      } catch (error) {
        return {
          success: false,
          error: { code: 'GET_STATS_FAILED', message: String(error) },
        };
      }
    },

    async cancelCampaign(campaignId: string): Promise<ApiResponse<void>> {
      try {
        await apiRequest(`/campaigns/${campaignId}/status`, 'PUT', {
          status: 'cancelled',
        });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'CANCEL_FAILED', message: String(error) },
        };
      }
    },
  };

  return provider;
}

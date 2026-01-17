/**
 * Manual Tracking Provider
 * Tracking managed via self-hosted backend API
 */

import { ApiResponse, Unsubscribe } from '../../types/common';
import { Address, Price } from '../../types/common';
import {
  ITrackingProvider,
  TrackingInfo,
  TrackingStatus,
  TrackingEvent,
  TrackingUpdateCallback,
  ShippingRate,
  GetRatesOptions,
  CreateShipmentOptions,
  Shipment,
  PickupPoint,
} from './TrackingProvider.interface';

/** Manual tracking provider configuration */
export interface ManualTrackingConfig {
  /** API base URL */
  apiUrl: string;
  /** Optional API key */
  apiKey?: string;
  /** Polling interval for updates (ms) */
  pollingInterval?: number;
  /** Enable real-time via Socket.io */
  enableRealtime?: boolean;
}

/** Carrier info for URL templates */
const CARRIER_URLS: Record<string, string> = {
  colissimo: 'https://www.laposte.fr/outils/suivre-vos-envois?code={tracking}',
  chronopost: 'https://www.chronopost.fr/tracking-no-cms/suivi-page?liession={tracking}',
  mondialrelay: 'https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition={tracking}',
  ups: 'https://www.ups.com/track?loc=en_US&tracknum={tracking}',
  fedex: 'https://www.fedex.com/fedextrack/?trknbr={tracking}',
  dhl: 'https://www.dhl.com/en/express/tracking.html?AWB={tracking}',
  dpd: 'https://tracking.dpd.de/status/en_US/parcel/{tracking}',
  gls: 'https://gls-group.eu/FR/en/parcel-tracking?match={tracking}',
};

/** Create Manual Tracking Provider */
export function createManualTrackingProvider(config: ManualTrackingConfig): ITrackingProvider {
  const { apiUrl, apiKey, pollingInterval = 60000, enableRealtime = false } = config;

  let initialized = false;
  const subscriptions = new Map<string, { callback: TrackingUpdateCallback; intervalId?: NodeJS.Timeout }>();
  let socket: unknown = null;

  /** Make API request */
  const apiRequest = async <T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<ApiResponse<T>> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method,
        headers,
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errorData.message || `HTTP error ${response.status}`,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err.message || 'Network error occurred',
        },
      };
    }
  };

  /** Get tracking URL for carrier */
  const getTrackingUrl = (trackingNumber: string, carrier: string): string => {
    const template = CARRIER_URLS[carrier.toLowerCase()];
    if (template) {
      return template.replace('{tracking}', encodeURIComponent(trackingNumber));
    }
    return '';
  };

  /** Initialize Socket.io for real-time updates */
  const initializeRealtime = async () => {
    if (!enableRealtime || socket) return;

    try {
      const { io } = await import('socket.io-client');
      socket = io(apiUrl, {
        auth: apiKey ? { token: apiKey } : undefined,
        transports: ['websocket', 'polling'],
      });

      (socket as any).on('tracking:update', (data: { trackingNumber: string; tracking: TrackingInfo }) => {
        const subscription = subscriptions.get(data.trackingNumber);
        if (subscription) {
          subscription.callback(data.tracking);
        }
      });
    } catch (error) {
      console.warn('Real-time tracking not available:', error);
    }
  };

  const provider: ITrackingProvider = {
    name: 'Manual Tracking',
    type: 'manual',

    async initialize(): Promise<void> {
      if (initialized) return;

      if (enableRealtime) {
        await initializeRealtime();
      }

      initialized = true;
    },

    async dispose(): Promise<void> {
      // Clear all subscriptions
      for (const [, subscription] of subscriptions) {
        if (subscription.intervalId) {
          clearInterval(subscription.intervalId);
        }
      }
      subscriptions.clear();

      // Disconnect socket
      if (socket) {
        (socket as any).disconnect();
        socket = null;
      }

      initialized = false;
    },

    isReady(): boolean {
      return initialized;
    },

    async getStatus(trackingNumber: string, carrier?: string): Promise<ApiResponse<TrackingInfo>> {
      const endpoint = carrier
        ? `/tracking/${encodeURIComponent(trackingNumber)}?carrier=${encodeURIComponent(carrier)}`
        : `/tracking/${encodeURIComponent(trackingNumber)}`;

      const result = await apiRequest<TrackingInfo>(endpoint);

      if (result.success && result.data) {
        // Add tracking URL if not present
        if (!result.data.currentLocation && carrier) {
          const trackingUrl = getTrackingUrl(trackingNumber, carrier);
          if (trackingUrl) {
            result.data = { ...result.data, metadata: { ...result.data.metadata, trackingUrl } };
          }
        }
      }

      return result;
    },

    subscribe(
      trackingNumber: string,
      callback: TrackingUpdateCallback,
      carrier?: string
    ): Unsubscribe {
      // Store subscription
      const subscription: { callback: TrackingUpdateCallback; intervalId?: NodeJS.Timeout } = {
        callback,
      };

      // If real-time is enabled and socket connected, subscribe via socket
      if (enableRealtime && socket) {
        (socket as any).emit('tracking:subscribe', { trackingNumber, carrier });
      } else {
        // Fallback to polling
        subscription.intervalId = setInterval(async () => {
          const result = await provider.getStatus(trackingNumber, carrier);
          if (result.success && result.data) {
            callback(result.data);
          }
        }, pollingInterval);
      }

      subscriptions.set(trackingNumber, subscription);

      // Return unsubscribe function
      return () => {
        const sub = subscriptions.get(trackingNumber);
        if (sub?.intervalId) {
          clearInterval(sub.intervalId);
        }
        if (enableRealtime && socket) {
          (socket as any).emit('tracking:unsubscribe', { trackingNumber });
        }
        subscriptions.delete(trackingNumber);
      };
    },

    async getRates(options: GetRatesOptions): Promise<ApiResponse<ShippingRate[]>> {
      return apiRequest<ShippingRate[]>('/shipping/rates', 'POST', options);
    },

    async createShipment(options: CreateShipmentOptions): Promise<ApiResponse<Shipment>> {
      return apiRequest<Shipment>('/shipping/shipments', 'POST', options);
    },

    async cancelShipment(shipmentId: string): Promise<ApiResponse<void>> {
      return apiRequest<void>(`/shipping/shipments/${encodeURIComponent(shipmentId)}/cancel`, 'POST');
    },

    async getShipment(shipmentId: string): Promise<ApiResponse<Shipment>> {
      return apiRequest<Shipment>(`/shipping/shipments/${encodeURIComponent(shipmentId)}`);
    },

    async getLabel(shipmentId: string, format: 'pdf' | 'png' | 'zpl' = 'pdf'): Promise<ApiResponse<string>> {
      return apiRequest<string>(`/shipping/shipments/${encodeURIComponent(shipmentId)}/label?format=${format}`);
    },

    async findPickupPoints(address: string | Address, limit: number = 10): Promise<ApiResponse<PickupPoint[]>> {
      const addressParam = typeof address === 'string'
        ? address
        : `${address.postalCode},${address.country}`;

      return apiRequest<PickupPoint[]>(
        `/shipping/pickup-points?address=${encodeURIComponent(addressParam)}&limit=${limit}`
      );
    },

    async validateAddress(address: Address): Promise<ApiResponse<Address>> {
      return apiRequest<Address>('/shipping/validate-address', 'POST', address);
    },

    getSupportedCarriers(): string[] {
      return [
        'manual',
        'colissimo',
        'chronopost',
        'mondialrelay',
        'ups',
        'fedex',
        'dhl',
        'dpd',
        'gls',
      ];
    },
  };

  return provider;
}

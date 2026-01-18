/**
 * Shipping Provider Interface
 * Defines the contract for all shipping/carrier providers
 */

import { Address, ApiResponse } from '../../types/common';
import { ShippingOption, PickupPoint } from '../../types/cart';
import { BaseProvider } from '../types';

/** Shipping rate request */
export interface ShippingRateRequest {
  /** Destination address */
  address: Address;
  /** Cart items with weight and dimensions */
  items: ShippingItem[];
  /** Total weight in kg */
  totalWeight?: number;
  /** Total value for insurance */
  totalValue?: number;
  /** Currency */
  currency?: string;
}

/** Item for shipping calculation */
export interface ShippingItem {
  id: string;
  name: string;
  quantity: number;
  weight?: number; // in kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  value?: number;
}

/** Tracking event */
export interface TrackingEvent {
  timestamp: string;
  status: TrackingStatus;
  location?: string;
  description: string;
}

/** Tracking status */
export type TrackingStatus =
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception'
  | 'returned';

/** Tracking info */
export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: TrackingStatus;
  estimatedDelivery?: string;
  events: TrackingEvent[];
  trackingUrl?: string;
}

/** Shipment label */
export interface ShipmentLabel {
  id: string;
  trackingNumber: string;
  carrier: string;
  labelUrl: string;
  labelFormat: 'pdf' | 'png' | 'zpl';
  createdAt: string;
}

/** Create shipment request */
export interface CreateShipmentRequest {
  orderId: string;
  shippingOptionId: string;
  fromAddress: Address;
  toAddress: Address;
  items: ShippingItem[];
  pickupPointId?: string;
}

/** Shipping provider type */
export type ShippingProviderType =
  | 'manual'
  | 'colissimo'
  | 'chronopost'
  | 'mondialrelay'
  | 'ups'
  | 'fedex'
  | 'dhl'
  | 'shippo'
  | 'easypost';

/** Shipping provider interface */
export interface IShippingProvider extends BaseProvider {
  /** Provider type identifier */
  readonly type: ShippingProviderType;

  /** Carrier display name */
  readonly carrierName: string;

  /**
   * Get available shipping rates
   * @param request - Shipping rate request
   * @returns List of shipping options with prices
   */
  getShippingRates(request: ShippingRateRequest): Promise<ApiResponse<ShippingOption[]>>;

  /**
   * Get pickup points near an address
   * @param address - Destination address
   * @param radius - Search radius in km
   * @returns List of pickup points
   */
  getPickupPoints?(address: Address, radius?: number): Promise<ApiResponse<PickupPoint[]>>;

  /**
   * Create a shipment and generate label
   * @param request - Create shipment request
   * @returns Shipment label
   */
  createShipment?(request: CreateShipmentRequest): Promise<ApiResponse<ShipmentLabel>>;

  /**
   * Track a shipment
   * @param trackingNumber - Tracking number
   * @returns Tracking info
   */
  trackShipment?(trackingNumber: string): Promise<ApiResponse<TrackingInfo>>;

  /**
   * Cancel a shipment
   * @param shipmentId - Shipment ID
   * @returns Success status
   */
  cancelShipment?(shipmentId: string): Promise<ApiResponse<void>>;

  /**
   * Get label for existing shipment
   * @param shipmentId - Shipment ID
   * @returns Label URL
   */
  getLabel?(shipmentId: string): Promise<ApiResponse<ShipmentLabel>>;
}

/** Manual shipping configuration */
export interface ManualShippingConfig {
  options: ManualShippingOption[];
}

/** Manual shipping option */
export interface ManualShippingOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  estimatedDays: { min: number; max: number };
  /** Countries this option is available for (ISO codes) */
  countries?: string[];
  /** Minimum order weight in kg */
  minWeight?: number;
  /** Maximum order weight in kg */
  maxWeight?: number;
  /** Minimum order value */
  minOrderValue?: number;
  /** Free shipping above this value */
  freeAbove?: number;
  /** Is this a pickup point option */
  isPickupPoint?: boolean;
}

/** Carrier API configuration */
export interface CarrierApiConfig {
  apiKey?: string;
  apiSecret?: string;
  accountNumber?: string;
  contractNumber?: string;
  testMode?: boolean;
}

/** Shipping provider options */
export interface ShippingProviderOptions {
  /** Default weight if not specified (kg) */
  defaultWeight?: number;
  /** Enable caching */
  enableCache?: boolean;
  /** Cache duration in seconds */
  cacheDuration?: number;
}

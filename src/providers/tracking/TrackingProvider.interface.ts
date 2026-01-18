/**
 * Tracking/Shipping Provider Interface
 * Defines the contract for all tracking/shipping providers
 */

import { ApiResponse, Callback, Unsubscribe } from '../../types/common';
import { Address, Price } from '../../types/common';
import { BaseProvider } from '../types';

/** Tracking status */
export type TrackingStatus =
  | 'unknown'
  | 'pre_transit'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'available_for_pickup'
  | 'return_to_sender'
  | 'failure'
  | 'cancelled';

/** Tracking info */
export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: TrackingStatus;
  statusDescription: string;
  estimatedDelivery?: Date | string;
  actualDelivery?: Date | string;
  origin?: TrackingLocation;
  destination?: TrackingLocation;
  currentLocation?: TrackingLocation;
  events: TrackingEvent[];
  signedBy?: string;
  weight?: number;
  metadata?: Record<string, unknown>;
}

/** Tracking location */
export interface TrackingLocation {
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/** Tracking event */
export interface TrackingEvent {
  timestamp: Date | string;
  status: TrackingStatus;
  statusDescription: string;
  location?: TrackingLocation;
  details?: string;
}

/** Shipping rate */
export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  serviceName: string;
  price: Price;
  currency: string;
  estimatedDays: number;
  estimatedDelivery?: Date | string;
  attributes?: ShippingAttributes;
}

/** Shipping attributes */
export interface ShippingAttributes {
  signature?: boolean;
  insurance?: boolean;
  tracking?: boolean;
  saturdayDelivery?: boolean;
  expressService?: boolean;
}

/** Get rates options */
export interface GetRatesOptions {
  from: Address;
  to: Address;
  parcel: ParcelInfo;
  insurance?: number;
  signature?: boolean;
}

/** Parcel info */
export interface ParcelInfo {
  length: number;
  width: number;
  height: number;
  weight: number;
  distanceUnit?: 'cm' | 'in';
  massUnit?: 'kg' | 'lb';
}

/** Create shipment options */
export interface CreateShipmentOptions {
  rateId: string;
  from: Address;
  to: Address;
  parcel: ParcelInfo;
  returnAddress?: Address;
  reference?: string;
  metadata?: Record<string, unknown>;
}

/** Shipment */
export interface Shipment {
  id: string;
  trackingNumber: string;
  carrier: string;
  service: string;
  labelUrl: string;
  labelFormat?: 'pdf' | 'png' | 'zpl';
  status: ShipmentStatus;
  rate: ShippingRate;
  from: Address;
  to: Address;
  tracking?: TrackingInfo;
  createdAt: Date | string;
}

/** Shipment status */
export type ShipmentStatus =
  | 'pending'
  | 'purchased'
  | 'label_printed'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'error';

/** Pickup point */
export interface PickupPoint {
  id: string;
  name: string;
  carrier: string;
  address: Address;
  openingHours?: OpeningHours[];
  distance?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  type?: 'locker' | 'shop' | 'post_office';
}

/** Opening hours */
export interface OpeningHours {
  day: number;
  open: string;
  close: string;
}

/** Tracking update callback */
export type TrackingUpdateCallback = Callback<TrackingInfo>;

/** Tracking provider interface */
export interface ITrackingProvider extends BaseProvider {
  /**
   * Get tracking status for a shipment
   * @param trackingNumber - Tracking number
   * @param carrier - Carrier code (optional if auto-detect supported)
   * @returns Promise with tracking info
   */
  getStatus(
    trackingNumber: string,
    carrier?: string
  ): Promise<ApiResponse<TrackingInfo>>;

  /**
   * Subscribe to tracking updates
   * @param trackingNumber - Tracking number
   * @param callback - Update callback
   * @param carrier - Carrier code
   * @returns Unsubscribe function
   */
  subscribe(
    trackingNumber: string,
    callback: TrackingUpdateCallback,
    carrier?: string
  ): Unsubscribe;

  /**
   * Get shipping rates
   * @param options - Rate options
   * @returns Promise with array of rates
   */
  getRates(options: GetRatesOptions): Promise<ApiResponse<ShippingRate[]>>;

  /**
   * Create a shipment and purchase label
   * @param options - Shipment options
   * @returns Promise with shipment data
   */
  createShipment(options: CreateShipmentOptions): Promise<ApiResponse<Shipment>>;

  /**
   * Cancel a shipment
   * @param shipmentId - Shipment ID
   * @returns Promise with success status
   */
  cancelShipment(shipmentId: string): Promise<ApiResponse<void>>;

  /**
   * Get shipment by ID
   * @param shipmentId - Shipment ID
   * @returns Promise with shipment data
   */
  getShipment(shipmentId: string): Promise<ApiResponse<Shipment>>;

  /**
   * Get shipping label
   * @param shipmentId - Shipment ID
   * @param format - Label format
   * @returns Promise with label URL or data
   */
  getLabel(
    shipmentId: string,
    format?: 'pdf' | 'png' | 'zpl'
  ): Promise<ApiResponse<string>>;

  /**
   * Find nearby pickup points
   * @param address - Address or postal code
   * @param limit - Maximum number of results
   * @returns Promise with array of pickup points
   */
  findPickupPoints?(
    address: string | Address,
    limit?: number
  ): Promise<ApiResponse<PickupPoint[]>>;

  /**
   * Validate address
   * @param address - Address to validate
   * @returns Promise with validated/corrected address
   */
  validateAddress?(address: Address): Promise<ApiResponse<Address>>;

  /**
   * Get supported carriers
   * @returns Array of supported carrier codes
   */
  getSupportedCarriers(): string[];
}

/** Tracking provider options */
export interface TrackingProviderOptions {
  /** Default distance unit */
  defaultDistanceUnit?: 'cm' | 'in';

  /** Default mass unit */
  defaultMassUnit?: 'kg' | 'lb';

  /** Polling interval for tracking updates (ms) */
  pollingInterval?: number;

  /** Cache tracking results (seconds) */
  cacheTimeout?: number;
}

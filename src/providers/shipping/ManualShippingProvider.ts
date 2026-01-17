/**
 * Manual Shipping Provider
 * Uses predefined shipping options from configuration
 */

import { Address, ApiResponse } from '../../types/common';
import { ShippingOption, PickupPoint } from '../../types/cart';
import {
  IShippingProvider,
  ShippingRateRequest,
  ManualShippingConfig,
  ManualShippingOption,
  ShippingProviderOptions,
} from './ShippingProvider.interface';

/**
 * Create Manual Shipping Provider
 */
export function createManualShippingProvider(
  config: ManualShippingConfig,
  _options: ShippingProviderOptions = {}
): IShippingProvider {
  let initialized = false;

  /** Calculate total weight from items */
  const calculateTotalWeight = (request: ShippingRateRequest): number => {
    if (request.totalWeight) return request.totalWeight;

    return request.items.reduce((total, item) => {
      return total + (item.weight || 0.5) * item.quantity;
    }, 0);
  };

  /** Calculate total value from items */
  const calculateTotalValue = (request: ShippingRateRequest): number => {
    if (request.totalValue) return request.totalValue;

    return request.items.reduce((total, item) => {
      return total + (item.value || 0) * item.quantity;
    }, 0);
  };

  /** Check if option is available for given request */
  const isOptionAvailable = (
    option: ManualShippingOption,
    request: ShippingRateRequest,
    totalWeight: number,
    totalValue: number
  ): boolean => {
    // Check country restriction
    if (option.countries && option.countries.length > 0) {
      if (!option.countries.includes(request.address.country)) {
        return false;
      }
    }

    // Check weight restrictions
    if (option.minWeight !== undefined && totalWeight < option.minWeight) {
      return false;
    }
    if (option.maxWeight !== undefined && totalWeight > option.maxWeight) {
      return false;
    }

    // Check minimum order value
    if (option.minOrderValue !== undefined && totalValue < option.minOrderValue) {
      return false;
    }

    return true;
  };

  /** Calculate price for option */
  const calculatePrice = (
    option: ManualShippingOption,
    totalValue: number
  ): number => {
    // Free shipping above certain value
    if (option.freeAbove !== undefined && totalValue >= option.freeAbove) {
      return 0;
    }

    return option.price;
  };

  const provider: IShippingProvider = {
    name: 'Manual Shipping',
    type: 'manual',
    carrierName: 'Standard Shipping',

    async initialize(): Promise<void> {
      if (initialized) return;

      if (!config.options || config.options.length === 0) {
        throw new Error('Manual shipping provider requires at least one shipping option');
      }

      initialized = true;
    },

    async dispose(): Promise<void> {
      initialized = false;
    },

    isReady(): boolean {
      return initialized;
    },

    async getShippingRates(request: ShippingRateRequest): Promise<ApiResponse<ShippingOption[]>> {
      try {
        const totalWeight = calculateTotalWeight(request);
        const totalValue = calculateTotalValue(request);
        const currency = request.currency || 'EUR';

        const availableOptions: ShippingOption[] = config.options
          .filter((option) => isOptionAvailable(option, request, totalWeight, totalValue))
          .map((option) => {
            const price = calculatePrice(option, totalValue);

            return {
              id: option.id,
              carrier: 'manual',
              carrierId: 'manual',
              name: option.name,
              description: option.description,
              price: {
                amount: price,
                currency,
                formatted: `${price.toFixed(2)} ${currency}`,
              },
              estimatedDays: option.estimatedDays,
              isPickupPoint: option.isPickupPoint || false,
            };
          });

        return { success: true, data: availableOptions };
      } catch (error) {
        const err = error as Error;
        return {
          success: false,
          error: {
            code: 'SHIPPING_ERROR',
            message: err.message,
          },
        };
      }
    },

    async getPickupPoints(
      _address: Address,
      _radius?: number
    ): Promise<ApiResponse<PickupPoint[]>> {
      // Manual provider doesn't support pickup points dynamically
      // Pickup points would need to be configured separately
      return { success: true, data: [] };
    },
  };

  return provider;
}

/** Default shipping options for quick setup */
export const defaultShippingOptions: ManualShippingOption[] = [
  {
    id: 'standard',
    name: 'Livraison Standard',
    description: 'Livraison en 3-5 jours ouvrés',
    price: 4.99,
    currency: 'EUR',
    estimatedDays: { min: 3, max: 5 },
    freeAbove: 50,
  },
  {
    id: 'express',
    name: 'Livraison Express',
    description: 'Livraison en 1-2 jours ouvrés',
    price: 9.99,
    currency: 'EUR',
    estimatedDays: { min: 1, max: 2 },
  },
  {
    id: 'pickup',
    name: 'Point Relais',
    description: 'Retrait en point relais sous 3-5 jours',
    price: 3.99,
    currency: 'EUR',
    estimatedDays: { min: 3, max: 5 },
    isPickupPoint: true,
    freeAbove: 35,
  },
];

export default createManualShippingProvider;

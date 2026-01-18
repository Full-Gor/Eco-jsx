/**
 * Checkout Context
 * Manages checkout flow state and operations
 */

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Address } from '../types/common';
import {
  CheckoutState,
  CheckoutStep,
  ShippingOption,
  PickupPoint,
  SavedPaymentMethod,
  AppliedPromoCode,
  Order,
  PaymentMethod,
} from '../types/cart';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { getConfig } from '../config';

interface CheckoutContextValue {
  /** Current checkout state */
  state: CheckoutState;
  /** Is checkout loading */
  isLoading: boolean;
  /** Checkout error */
  error: string | null;
  /** Available shipping options */
  shippingOptions: ShippingOption[];
  /** Available payment methods */
  paymentMethods: SavedPaymentMethod[];
  /** User's saved addresses */
  savedAddresses: Address[];
  /** Step navigation */
  currentStep: CheckoutStep;
  canGoNext: boolean;
  canGoBack: boolean;
  goToStep: (step: CheckoutStep) => void;
  goNext: () => void;
  goBack: () => void;
  /** Address methods */
  setShippingAddress: (address: Address) => void;
  setBillingAddress: (address: Address | null) => void;
  setUseSameAddress: (useSame: boolean) => void;
  /** Shipping methods */
  loadShippingOptions: () => Promise<void>;
  selectShippingOption: (option: ShippingOption) => void;
  selectPickupPoint: (point: PickupPoint) => void;
  /** Payment methods */
  loadPaymentMethods: () => Promise<void>;
  selectPaymentMethod: (method: SavedPaymentMethod | null) => void;
  setUseNewCard: (useNew: boolean) => void;
  setSaveCard: (save: boolean) => void;
  /** Order methods */
  setAcceptedTerms: (accepted: boolean) => void;
  placeOrder: () => Promise<Order | null>;
  /** Reset checkout */
  resetCheckout: () => void;
}

const initialState: CheckoutState = {
  step: 'address',
  shippingAddress: null,
  billingAddress: null,
  useSameAddress: true,
  shippingOption: null,
  selectedPickupPoint: null,
  paymentMethod: null,
  useNewCard: false,
  saveCard: false,
  promoCode: null,
  acceptedTerms: false,
};

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

interface CheckoutProviderProps {
  children: ReactNode;
}

const STEPS: CheckoutStep[] = ['address', 'shipping', 'payment', 'confirmation'];

export function CheckoutProvider({ children }: CheckoutProviderProps) {
  const { cart, summary, clearCart } = useCart();
  const { user, addresses: userAddresses } = useAuth();

  const [state, setState] = useState<CheckoutState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);

  const config = getConfig();

  // Get saved addresses from user profile
  const savedAddresses = useMemo(() => {
    return userAddresses || [];
  }, [userAddresses]);

  // Current step index
  const currentStepIndex = STEPS.indexOf(state.step);

  // Can navigate to next step
  const canGoNext = useMemo(() => {
    switch (state.step) {
      case 'address':
        return !!state.shippingAddress && (state.useSameAddress || !!state.billingAddress);
      case 'shipping':
        return !!state.shippingOption;
      case 'payment':
        return !!state.paymentMethod || state.useNewCard;
      case 'confirmation':
        return state.acceptedTerms;
      default:
        return false;
    }
  }, [state]);

  // Can go back
  const canGoBack = currentStepIndex > 0;

  // Go to specific step
  const goToStep = useCallback((step: CheckoutStep) => {
    setState(prev => ({ ...prev, step }));
    setError(null);
  }, []);

  // Go to next step
  const goNext = useCallback(() => {
    if (currentStepIndex < STEPS.length - 1) {
      goToStep(STEPS[currentStepIndex + 1]);
    }
  }, [currentStepIndex, goToStep]);

  // Go to previous step
  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      goToStep(STEPS[currentStepIndex - 1]);
    }
  }, [currentStepIndex, goToStep]);

  // Set shipping address
  const setShippingAddress = useCallback((address: Address) => {
    setState(prev => ({
      ...prev,
      shippingAddress: address,
      billingAddress: prev.useSameAddress ? address : prev.billingAddress,
    }));
  }, []);

  // Set billing address
  const setBillingAddress = useCallback((address: Address | null) => {
    setState(prev => ({ ...prev, billingAddress: address }));
  }, []);

  // Set use same address
  const setUseSameAddress = useCallback((useSame: boolean) => {
    setState(prev => ({
      ...prev,
      useSameAddress: useSame,
      billingAddress: useSame ? prev.shippingAddress : prev.billingAddress,
    }));
  }, []);

  // Load shipping options
  const loadShippingOptions = useCallback(async () => {
    if (!state.shippingAddress) {
      setError('Shipping address is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = config.apiUrl || 'https://api.example.com';
      const response = await fetch(`${apiUrl}/shipping/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: state.shippingAddress,
          items: cart?.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            weight: item.product.weight || 0.5,
          })),
          orderValue: summary.subtotal.amount,
          currency: summary.subtotal.currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load shipping options');
      }

      const data = await response.json();
      setShippingOptions(data.options || []);
    } catch (err) {
      // Fallback to default options for development
      setShippingOptions([
        {
          id: 'standard',
          carrier: 'Standard',
          carrierId: 'standard',
          name: 'Standard Shipping',
          description: '3-5 business days',
          price: { amount: 4.99, currency: 'EUR', formatted: '4,99 EUR' },
          estimatedDays: { min: 3, max: 5 },
          isPickupPoint: false,
        },
        {
          id: 'express',
          carrier: 'Express',
          carrierId: 'express',
          name: 'Express Shipping',
          description: '1-2 business days',
          price: { amount: 9.99, currency: 'EUR', formatted: '9,99 EUR' },
          estimatedDays: { min: 1, max: 2 },
          isPickupPoint: false,
        },
        {
          id: 'pickup',
          carrier: 'Point Relais',
          carrierId: 'mondialrelay',
          name: 'Pickup Point',
          description: '3-4 business days',
          price: { amount: 3.99, currency: 'EUR', formatted: '3,99 EUR' },
          estimatedDays: { min: 3, max: 4 },
          isPickupPoint: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [state.shippingAddress, cart, summary, config.apiUrl]);

  // Select shipping option
  const selectShippingOption = useCallback((option: ShippingOption) => {
    setState(prev => ({
      ...prev,
      shippingOption: option,
      selectedPickupPoint: option.isPickupPoint ? prev.selectedPickupPoint : null,
    }));
  }, []);

  // Select pickup point
  const selectPickupPoint = useCallback((point: PickupPoint) => {
    setState(prev => ({ ...prev, selectedPickupPoint: point }));
  }, []);

  // Load payment methods
  const loadPaymentMethods = useCallback(async () => {
    if (!user) {
      setPaymentMethods([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = config.apiUrl || 'https://api.example.com';

      const response = await fetch(`${apiUrl}/users/payment-methods`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load payment methods');
      }

      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (err) {
      // Keep empty payment methods on error
      setPaymentMethods([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, config.apiUrl]);

  // Select payment method
  const selectPaymentMethod = useCallback((method: SavedPaymentMethod | null) => {
    setState(prev => ({
      ...prev,
      paymentMethod: method,
      useNewCard: !method,
    }));
  }, []);

  // Set use new card
  const setUseNewCard = useCallback((useNew: boolean) => {
    setState(prev => ({
      ...prev,
      useNewCard: useNew,
      paymentMethod: useNew ? null : prev.paymentMethod,
    }));
  }, []);

  // Set save card
  const setSaveCard = useCallback((save: boolean) => {
    setState(prev => ({ ...prev, saveCard: save }));
  }, []);

  // Set accepted terms
  const setAcceptedTerms = useCallback((accepted: boolean) => {
    setState(prev => ({ ...prev, acceptedTerms: accepted }));
  }, []);

  // Place order
  const placeOrder = useCallback(async (): Promise<Order | null> => {
    if (!cart || cart.items.length === 0) {
      setError('Cart is empty');
      return null;
    }

    if (!state.shippingAddress) {
      setError('Shipping address is required');
      return null;
    }

    if (!state.shippingOption) {
      setError('Shipping option is required');
      return null;
    }

    if (!state.paymentMethod && !state.useNewCard) {
      setError('Payment method is required');
      return null;
    }

    if (!state.acceptedTerms) {
      setError('Please accept the terms and conditions');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = config.apiUrl || 'https://api.example.com';

      const orderData = {
        items: cart.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        shippingAddress: state.shippingAddress,
        billingAddress: state.useSameAddress ? state.shippingAddress : state.billingAddress,
        shippingOption: {
          id: state.shippingOption.id,
          carrier: state.shippingOption.carrier,
          price: state.shippingOption.price,
        },
        pickupPoint: state.selectedPickupPoint ? {
          id: state.selectedPickupPoint.id,
          name: state.selectedPickupPoint.name,
          address: state.selectedPickupPoint.address,
        } : null,
        paymentMethodId: state.paymentMethod?.id,
        useNewCard: state.useNewCard,
        saveCard: state.saveCard,
        promoCode: cart.promoCode?.code,
        subtotal: summary.subtotal,
        shippingCost: state.shippingOption.price,
        discount: summary.discount,
        tax: summary.tax,
        total: summary.total,
      };

      const response = await fetch(`${apiUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create order');
      }

      const order: Order = await response.json();

      // Clear cart after successful order
      await clearCart();

      // Reset checkout state
      setState(initialState);

      return order;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place order';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [cart, state, summary, user, config.apiUrl, clearCart]);

  // Reset checkout
  const resetCheckout = useCallback(() => {
    setState(initialState);
    setShippingOptions([]);
    setError(null);
  }, []);

  const value: CheckoutContextValue = {
    state,
    isLoading,
    error,
    shippingOptions,
    paymentMethods,
    savedAddresses,
    currentStep: state.step,
    canGoNext,
    canGoBack,
    goToStep,
    goNext,
    goBack,
    setShippingAddress,
    setBillingAddress,
    setUseSameAddress,
    loadShippingOptions,
    selectShippingOption,
    selectPickupPoint,
    loadPaymentMethods,
    selectPaymentMethod,
    setUseNewCard,
    setSaveCard,
    setAcceptedTerms,
    placeOrder,
    resetCheckout,
  };

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout(): CheckoutContextValue {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}

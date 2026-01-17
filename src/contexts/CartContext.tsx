/**
 * Cart Context
 * Provides cart state and operations throughout the app
 * Supports local storage persistence and server sync
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Cart,
  CartItem,
  CartSummary,
  AppliedPromoCode,
  PromoCodeValidation,
  ShippingOption,
} from '../types/cart';
import { Product, ProductVariant } from '../types/product';
import { Address, ApiResponse, Price } from '../types/common';
import { useAuth } from './AuthContext';
import { getConfig } from '../config';

/** Cart storage key */
const CART_STORAGE_KEY = '@eco_cart';

/** Default currency */
const DEFAULT_CURRENCY = 'EUR';

/** Cart context value */
interface CartContextValue {
  // State
  cart: Cart | null;
  items: CartItem[];
  summary: CartSummary;
  itemCount: number;
  isLoading: boolean;
  error: string | null;

  // Item operations
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  updateVariant: (itemId: string, variant: ProductVariant) => Promise<boolean>;
  clearCart: () => Promise<void>;

  // Move item
  moveToWishlist: (itemId: string) => Promise<boolean>;

  // Promo code
  applyPromoCode: (code: string) => Promise<PromoCodeValidation>;
  removePromoCode: () => Promise<void>;

  // Shipping
  setShippingAddress: (address: Address) => void;
  setBillingAddress: (address: Address) => void;
  setShippingOption: (option: ShippingOption) => void;

  // Sync
  syncWithServer: () => Promise<void>;

  // Stock validation
  validateStock: () => Promise<CartItem[]>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

/** Calculate cart summary */
function calculateSummary(
  items: CartItem[],
  shippingOption: ShippingOption | null,
  promoCode: AppliedPromoCode | null,
  currency: string = DEFAULT_CURRENCY
): CartSummary {
  const subtotal = items.reduce((total, item) => {
    if (item.isAvailable) {
      return total + item.totalPrice.amount;
    }
    return total;
  }, 0);

  const itemCount = items.length;
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);

  let discount: Price | null = null;
  if (promoCode) {
    discount = promoCode.discount;
  }

  const shipping: Price | null = shippingOption
    ? shippingOption.price
    : null;

  // Calculate total
  let totalAmount = subtotal;
  if (discount) {
    totalAmount -= discount.amount;
  }
  if (shipping) {
    totalAmount += shipping.amount;
  }

  // Ensure total is not negative
  totalAmount = Math.max(0, totalAmount);

  return {
    subtotal: {
      amount: subtotal,
      currency,
      formatted: `${subtotal.toFixed(2)} ${currency}`,
    },
    shipping,
    discount,
    tax: null, // Tax calculation would depend on location
    total: {
      amount: totalAmount,
      currency,
      formatted: `${totalAmount.toFixed(2)} ${currency}`,
    },
    itemCount,
    totalQuantity,
  };
}

/** Cart Provider Props */
interface CartProviderProps {
  children: React.ReactNode;
}

/** Cart Provider */
export function CartProvider({ children }: CartProviderProps) {
  const { user, isAuthenticated } = useAuth();

  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shippingOption, setShippingOptionState] = useState<ShippingOption | null>(null);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(0);

  /** Get API URL from config */
  const getApiUrl = useCallback(() => {
    const config = getConfig();
    return config.apiUrl || '';
  }, []);

  /** Create empty cart */
  const createEmptyCart = useCallback((): Cart => ({
    id: `cart_${Date.now()}`,
    userId: user?.id,
    items: [],
    summary: calculateSummary([], null, null),
    updatedAt: new Date().toISOString(),
  }), [user?.id]);

  /** Save cart to local storage */
  const saveToStorage = useCallback(async (cartData: Cart) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    } catch (err) {
      console.error('Failed to save cart to storage:', err);
    }
  }, []);

  /** Load cart from local storage */
  const loadFromStorage = useCallback(async (): Promise<Cart | null> => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error('Failed to load cart from storage:', err);
    }
    return null;
  }, []);

  /** Sync cart with server */
  const syncWithServer = useCallback(async () => {
    if (!isAuthenticated || !user?.id || !cart) return;

    const apiUrl = getApiUrl();
    if (!apiUrl) return;

    try {
      const response = await fetch(`${apiUrl}/cart/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          items: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          promoCode: cart.promoCode?.code,
        }),
      });

      if (response.ok) {
        const serverCart = await response.json();
        // Merge server cart (it may have updated prices, stock info)
        if (serverCart) {
          setCart((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              items: serverCart.items || prev.items,
              updatedAt: new Date().toISOString(),
            };
          });
        }
        lastSyncRef.current = Date.now();
      }
    } catch (err) {
      console.error('Failed to sync cart with server:', err);
    }
  }, [isAuthenticated, user?.id, cart, getApiUrl]);

  /** Schedule sync with debounce */
  const scheduleSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncWithServer();
    }, 2000); // Debounce sync by 2 seconds
  }, [syncWithServer]);

  /** Update cart and save */
  const updateCart = useCallback(
    async (updater: (prev: Cart) => Cart) => {
      setCart((prev) => {
        if (!prev) return prev;

        const updated = updater(prev);
        updated.summary = calculateSummary(
          updated.items,
          shippingOption,
          updated.promoCode || null
        );
        updated.updatedAt = new Date().toISOString();

        // Save to storage
        saveToStorage(updated);

        // Schedule server sync
        scheduleSync();

        return updated;
      });
    },
    [shippingOption, saveToStorage, scheduleSync]
  );

  /** Initialize cart on mount */
  useEffect(() => {
    const initCart = async () => {
      setIsLoading(true);

      try {
        // Load from storage first
        let storedCart = await loadFromStorage();

        // If user is logged in and cart has different userId, fetch from server
        if (isAuthenticated && user?.id) {
          const apiUrl = getApiUrl();
          if (apiUrl) {
            try {
              const response = await fetch(`${apiUrl}/cart/${user.id}`);
              if (response.ok) {
                const serverCart = await response.json();
                if (serverCart) {
                  // Merge local and server carts
                  if (storedCart && storedCart.items.length > 0) {
                    // Merge: add local items to server cart
                    const mergedItems = [...serverCart.items];
                    for (const localItem of storedCart.items) {
                      const exists = mergedItems.find(
                        (i) =>
                          i.productId === localItem.productId &&
                          i.variantId === localItem.variantId
                      );
                      if (!exists) {
                        mergedItems.push(localItem);
                      }
                    }
                    serverCart.items = mergedItems;
                  }
                  storedCart = serverCart;
                }
              }
            } catch {
              // Server fetch failed, use local cart
            }
          }
        }

        if (storedCart) {
          storedCart.userId = user?.id;
          setCart(storedCart);
        } else {
          setCart(createEmptyCart());
        }
      } catch (err) {
        console.error('Failed to initialize cart:', err);
        setCart(createEmptyCart());
      } finally {
        setIsLoading(false);
      }
    };

    initCart();
  }, [isAuthenticated, user?.id, loadFromStorage, createEmptyCart, getApiUrl]);

  /** Add item to cart */
  const addItem = useCallback(
    async (
      product: Product,
      quantity: number = 1,
      variant?: ProductVariant
    ): Promise<boolean> => {
      if (!cart) return false;

      setError(null);

      const variantToUse = variant || product.variants?.find((v) => v.isDefault) || product.variants?.[0];
      const price = variantToUse?.price || product.price;
      const stock = variantToUse?.stock ?? product.stock;

      // Check stock
      if (stock <= 0) {
        setError('Ce produit est en rupture de stock');
        return false;
      }

      // Check if item already exists
      const existingIndex = cart.items.findIndex(
        (item) =>
          item.productId === product.id &&
          item.variantId === variantToUse?.id
      );

      if (existingIndex >= 0) {
        // Update quantity
        const existingItem = cart.items[existingIndex];
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > stock) {
          setError(`Stock insuffisant. Maximum: ${stock}`);
          return false;
        }

        await updateCart((prev) => {
          const items = [...prev.items];
          items[existingIndex] = {
            ...existingItem,
            quantity: newQuantity,
            totalPrice: {
              amount: price.amount * newQuantity,
              currency: price.currency,
              formatted: `${(price.amount * newQuantity).toFixed(2)} ${price.currency}`,
            },
          };
          return { ...prev, items };
        });
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: product.id,
          product,
          variantId: variantToUse?.id,
          variant: variantToUse,
          quantity,
          price,
          totalPrice: {
            amount: price.amount * quantity,
            currency: price.currency,
            formatted: `${(price.amount * quantity).toFixed(2)} ${price.currency}`,
          },
          addedAt: new Date().toISOString(),
          isAvailable: stock > 0,
          availableStock: stock,
        };

        await updateCart((prev) => ({
          ...prev,
          items: [...prev.items, newItem],
        }));
      }

      return true;
    },
    [cart, updateCart]
  );

  /** Remove item from cart */
  const removeItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!cart) return false;

      await updateCart((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));

      return true;
    },
    [cart, updateCart]
  );

  /** Update item quantity */
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number): Promise<boolean> => {
      if (!cart || quantity < 1) return false;

      const item = cart.items.find((i) => i.id === itemId);
      if (!item) return false;

      // Check stock
      if (quantity > item.availableStock) {
        setError(`Stock insuffisant. Maximum: ${item.availableStock}`);
        return false;
      }

      await updateCart((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === itemId
            ? {
                ...i,
                quantity,
                totalPrice: {
                  amount: i.price.amount * quantity,
                  currency: i.price.currency,
                  formatted: `${(i.price.amount * quantity).toFixed(2)} ${i.price.currency}`,
                },
              }
            : i
        ),
      }));

      return true;
    },
    [cart, updateCart]
  );

  /** Update item variant */
  const updateVariant = useCallback(
    async (itemId: string, variant: ProductVariant): Promise<boolean> => {
      if (!cart) return false;

      const item = cart.items.find((i) => i.id === itemId);
      if (!item) return false;

      // Check if same variant already in cart
      const existingWithVariant = cart.items.find(
        (i) => i.id !== itemId && i.productId === item.productId && i.variantId === variant.id
      );

      if (existingWithVariant) {
        // Merge quantities
        const newQuantity = existingWithVariant.quantity + item.quantity;
        if (newQuantity > variant.stock) {
          setError(`Stock insuffisant. Maximum: ${variant.stock}`);
          return false;
        }

        await updateCart((prev) => ({
          ...prev,
          items: prev.items
            .filter((i) => i.id !== itemId)
            .map((i) =>
              i.id === existingWithVariant.id
                ? {
                    ...i,
                    quantity: newQuantity,
                    totalPrice: {
                      amount: variant.price.amount * newQuantity,
                      currency: variant.price.currency,
                      formatted: `${(variant.price.amount * newQuantity).toFixed(2)} ${variant.price.currency}`,
                    },
                  }
                : i
            ),
        }));
      } else {
        // Update variant
        await updateCart((prev) => ({
          ...prev,
          items: prev.items.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  variantId: variant.id,
                  variant,
                  price: variant.price,
                  totalPrice: {
                    amount: variant.price.amount * i.quantity,
                    currency: variant.price.currency,
                    formatted: `${(variant.price.amount * i.quantity).toFixed(2)} ${variant.price.currency}`,
                  },
                  availableStock: variant.stock,
                  isAvailable: variant.stock > 0,
                }
              : i
          ),
        }));
      }

      return true;
    },
    [cart, updateCart]
  );

  /** Clear cart */
  const clearCart = useCallback(async () => {
    setCart(createEmptyCart());
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
  }, [createEmptyCart]);

  /** Move item to wishlist */
  const moveToWishlist = useCallback(
    async (itemId: string): Promise<boolean> => {
      // TODO: Implement wishlist integration
      // For now, just remove from cart
      return removeItem(itemId);
    },
    [removeItem]
  );

  /** Apply promo code */
  const applyPromoCode = useCallback(
    async (code: string): Promise<PromoCodeValidation> => {
      if (!cart) {
        return { isValid: false, error: 'Panier non disponible' };
      }

      const apiUrl = getApiUrl();
      if (!apiUrl) {
        return { isValid: false, error: 'Service non disponible' };
      }

      try {
        const response = await fetch(`${apiUrl}/promo/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            cartTotal: cart.summary.subtotal.amount,
            userId: user?.id,
          }),
        });

        const result: PromoCodeValidation = await response.json();

        if (result.isValid && result.type && result.value !== undefined) {
          // Calculate discount
          let discountAmount = 0;
          const subtotal = cart.summary.subtotal.amount;

          switch (result.type) {
            case 'percentage':
              discountAmount = (subtotal * result.value) / 100;
              break;
            case 'fixed_amount':
              discountAmount = Math.min(result.value, subtotal);
              break;
            case 'free_shipping':
              // Handled separately
              break;
          }

          const appliedPromo: AppliedPromoCode = {
            code: result.code!,
            type: result.type,
            value: result.value,
            discount: {
              amount: discountAmount,
              currency: DEFAULT_CURRENCY,
              formatted: `-${discountAmount.toFixed(2)} ${DEFAULT_CURRENCY}`,
            },
            description: result.description,
          };

          await updateCart((prev) => ({
            ...prev,
            promoCode: appliedPromo,
          }));
        }

        return result;
      } catch (err) {
        const error = err as Error;
        return { isValid: false, error: error.message };
      }
    },
    [cart, user?.id, getApiUrl, updateCart]
  );

  /** Remove promo code */
  const removePromoCode = useCallback(async () => {
    await updateCart((prev) => {
      const updated = { ...prev };
      delete updated.promoCode;
      return updated;
    });
  }, [updateCart]);

  /** Set shipping address */
  const setShippingAddress = useCallback(
    (address: Address) => {
      updateCart((prev) => ({
        ...prev,
        shippingAddress: address,
      }));
    },
    [updateCart]
  );

  /** Set billing address */
  const setBillingAddress = useCallback(
    (address: Address) => {
      updateCart((prev) => ({
        ...prev,
        billingAddress: address,
      }));
    },
    [updateCart]
  );

  /** Set shipping option */
  const setShippingOption = useCallback(
    (option: ShippingOption) => {
      setShippingOptionState(option);
      updateCart((prev) => ({
        ...prev,
        shippingOptionId: option.id,
      }));
    },
    [updateCart]
  );

  /** Validate stock for all items */
  const validateStock = useCallback(async (): Promise<CartItem[]> => {
    if (!cart || cart.items.length === 0) return [];

    const apiUrl = getApiUrl();
    if (!apiUrl) return cart.items.filter((i) => !i.isAvailable);

    try {
      const response = await fetch(`${apiUrl}/cart/validate-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });

      const result = await response.json();

      if (result.items) {
        // Update cart with stock info
        await updateCart((prev) => ({
          ...prev,
          items: prev.items.map((item) => {
            const stockInfo = result.items.find(
              (s: { productId: string; variantId?: string; stock: number }) =>
                s.productId === item.productId && s.variantId === item.variantId
            );
            if (stockInfo) {
              return {
                ...item,
                availableStock: stockInfo.stock,
                isAvailable: stockInfo.stock >= item.quantity,
              };
            }
            return item;
          }),
        }));
      }

      return cart.items.filter((i) => !i.isAvailable);
    } catch {
      return cart.items.filter((i) => !i.isAvailable);
    }
  }, [cart, getApiUrl, updateCart]);

  // Recalculate summary when shipping option changes
  useEffect(() => {
    if (cart) {
      setCart((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          summary: calculateSummary(
            prev.items,
            shippingOption,
            prev.promoCode || null
          ),
        };
      });
    }
  }, [shippingOption]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const value: CartContextValue = {
    cart,
    items: cart?.items || [],
    summary: cart?.summary || calculateSummary([], null, null),
    itemCount: cart?.items.length || 0,
    isLoading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    updateVariant,
    clearCart,
    moveToWishlist,
    applyPromoCode,
    removePromoCode,
    setShippingAddress,
    setBillingAddress,
    setShippingOption,
    syncWithServer,
    validateStock,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** Use Cart hook */
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;

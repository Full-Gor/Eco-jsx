/**
 * Confirmation Step
 * Review order details before placing
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { useCheckout } from '../../../contexts/CheckoutContext';
import { useCart } from '../../../contexts/CartContext';

export function ConfirmationStep() {
  const theme = useTheme();
  const { state, goToStep, setAcceptedTerms } = useCheckout();
  const { items, summary } = useCart();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    editButtonText: {
      fontSize: 13,
      color: theme.colors.primary,
      marginLeft: 4,
    },
    addressContent: {
      marginBottom: theme.spacing.xs,
    },
    addressName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    addressText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    shippingContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    shippingInfo: {
      flex: 1,
    },
    shippingMethod: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    shippingDetails: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    shippingPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    pickupPointInfo: {
      marginTop: theme.spacing.sm,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    pickupPointLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    pickupPointName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    pickupPointAddress: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    paymentContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    paymentIconContainer: {
      width: 40,
      height: 28,
      borderRadius: 4,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    paymentInfo: {
      flex: 1,
    },
    paymentMethod: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    paymentDetails: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    itemsList: {
      marginBottom: theme.spacing.md,
    },
    itemCard: {
      flexDirection: 'row',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    itemCardLast: {
      borderBottomWidth: 0,
    },
    itemImage: {
      width: 60,
      height: 60,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.background,
      marginRight: theme.spacing.md,
    },
    itemImagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemContent: {
      flex: 1,
    },
    itemName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    itemVariant: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    itemQuantity: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    itemPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      alignSelf: 'flex-start',
    },
    summarySection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      color: theme.colors.text,
    },
    summaryDiscount: {
      color: theme.colors.success,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      marginVertical: theme.spacing.sm,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    promoCodeSection: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.success + '15',
      borderRadius: theme.borderRadius.sm,
      marginTop: theme.spacing.sm,
    },
    promoCodeText: {
      fontSize: 13,
      color: theme.colors.success,
      marginLeft: theme.spacing.xs,
      flex: 1,
    },
    promoCodeValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.success,
    },
    termsSection: {
      marginTop: theme.spacing.md,
    },
    termsCheckbox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.sm,
      marginTop: 2,
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    termsText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    termsLink: {
      color: theme.colors.primary,
      textDecorationLine: 'underline',
    },
  });

  const renderAddress = (address: typeof state.shippingAddress, title: string, step: 'address') => {
    if (!address) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => goToStep(step)}>
            <Ionicons name="pencil" size={14} color={theme.colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.addressContent}>
          <Text style={styles.addressName}>
            {address.firstName} {address.lastName}
          </Text>
          <Text style={styles.addressText}>{address.street}</Text>
          {address.street2 && <Text style={styles.addressText}>{address.street2}</Text>}
          <Text style={styles.addressText}>
            {address.postalCode} {address.city}, {address.country}
          </Text>
          {address.phone && <Text style={styles.addressText}>{address.phone}</Text>}
        </View>
      </View>
    );
  };

  const renderShipping = () => {
    if (!state.shippingOption) return null;

    const isFree = state.shippingOption.price.amount === 0;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shipping Method</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => goToStep('shipping')}>
            <Ionicons name="pencil" size={14} color={theme.colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.shippingContent}>
          <View style={styles.shippingInfo}>
            <Text style={styles.shippingMethod}>{state.shippingOption.name}</Text>
            <Text style={styles.shippingDetails}>
              {state.shippingOption.carrier} • {state.shippingOption.estimatedDays.min}-{state.shippingOption.estimatedDays.max} business days
            </Text>
          </View>
          <Text style={styles.shippingPrice}>
            {isFree ? 'FREE' : state.shippingOption.price.formatted}
          </Text>
        </View>
        {state.selectedPickupPoint && (
          <View style={styles.pickupPointInfo}>
            <Text style={styles.pickupPointLabel}>Pickup Point</Text>
            <Text style={styles.pickupPointName}>{state.selectedPickupPoint.name}</Text>
            <Text style={styles.pickupPointAddress}>
              {state.selectedPickupPoint.address.street}, {state.selectedPickupPoint.address.postalCode} {state.selectedPickupPoint.address.city}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderPayment = () => {
    const getPaymentIcon = () => {
      if (state.paymentMethod?.type === 'paypal') return 'logo-paypal';
      if (state.paymentMethod?.type === 'apple_pay') return 'logo-apple';
      return 'card';
    };

    const getPaymentLabel = () => {
      if (state.paymentMethod?.type === 'paypal') return 'PayPal';
      if (state.paymentMethod?.type === 'apple_pay') return 'Apple Pay';
      if (state.paymentMethod?.lastFourDigits) {
        return `${state.paymentMethod.brand?.toUpperCase() || 'Card'} •••• ${state.paymentMethod.lastFourDigits}`;
      }
      if (state.useNewCard) return 'New Card';
      return 'Card';
    };

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => goToStep('payment')}>
            <Ionicons name="pencil" size={14} color={theme.colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.paymentContent}>
          <View style={styles.paymentIconContainer}>
            <Ionicons name={getPaymentIcon() as any} size={20} color={theme.colors.textSecondary} />
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentMethod}>{getPaymentLabel()}</Text>
            {state.paymentMethod?.expiryMonth && (
              <Text style={styles.paymentDetails}>
                Expires {state.paymentMethod.expiryMonth.toString().padStart(2, '0')}/{state.paymentMethod.expiryYear?.toString().slice(-2)}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderItems = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Order Items ({items.length})</Text>
      </View>
      <View style={styles.itemsList}>
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[styles.itemCard, index === items.length - 1 && styles.itemCardLast]}
          >
            {item.product.images?.[0] ? (
              <Image
                source={{ uri: item.product.images[0].url }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                <Ionicons name="cube-outline" size={24} color={theme.colors.textSecondary} />
              </View>
            )}
            <View style={styles.itemContent}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.product.name}
              </Text>
              {item.variant && (
                <Text style={styles.itemVariant}>
                  {item.variant.name}
                </Text>
              )}
              <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>{item.totalPrice.formatted}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSummary = () => (
    <View style={styles.summarySection}>
      <Text style={styles.sectionTitle}>Order Summary</Text>

      <View style={{ height: theme.spacing.md }} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>{summary.subtotal.formatted}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Shipping</Text>
        <Text style={styles.summaryValue}>
          {state.shippingOption?.price.amount === 0
            ? 'FREE'
            : state.shippingOption?.price.formatted || '-'}
        </Text>
      </View>

      {summary.discount && summary.discount.amount > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Discount</Text>
          <Text style={[styles.summaryValue, styles.summaryDiscount]}>
            -{summary.discount.formatted}
          </Text>
        </View>
      )}

      {summary.tax && summary.tax.amount > 0 && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>{summary.tax.formatted}</Text>
        </View>
      )}

      <View style={styles.summaryDivider} />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{summary.total.formatted}</Text>
      </View>

      {summary.discount && summary.discount.amount > 0 && (
        <View style={styles.promoCodeSection}>
          <Ionicons name="pricetag" size={16} color={theme.colors.success} />
          <Text style={styles.promoCodeText}>Promo code applied</Text>
          <Text style={styles.promoCodeValue}>-{summary.discount.formatted}</Text>
        </View>
      )}
    </View>
  );

  const renderTerms = () => (
    <View style={styles.termsSection}>
      <TouchableOpacity
        style={styles.termsCheckbox}
        onPress={() => setAcceptedTerms(!state.acceptedTerms)}
      >
        <View style={[styles.checkbox, state.acceptedTerms && styles.checkboxChecked]}>
          {state.acceptedTerms && (
            <Ionicons name="checkmark" size={14} color={theme.colors.surface} />
          )}
        </View>
        <Text style={styles.termsText}>
          I agree to the{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
          . I understand that my order will be processed according to these terms.
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderAddress(state.shippingAddress, 'Shipping Address', 'address')}
      {!state.useSameAddress && renderAddress(state.billingAddress, 'Billing Address', 'address')}
      {renderShipping()}
      {renderPayment()}
      {renderItems()}
      {renderSummary()}
      {renderTerms()}
    </View>
  );
}

export default ConfirmationStep;

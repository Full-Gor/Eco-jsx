/**
 * Shipping Step
 * Select shipping method and pickup point if applicable
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { useCheckout } from '../../../contexts/CheckoutContext';
import { ShippingOption, PickupPoint } from '../../../types/cart';
import { Card } from '../../../components/common';

export function ShippingStep() {
  const theme = useTheme();
  const {
    state,
    shippingOptions,
    isLoading,
    loadShippingOptions,
    selectShippingOption,
    selectPickupPoint,
  } = useCheckout();

  const [showPickupPoints, setShowPickupPoints] = useState(false);

  // Load shipping options on mount
  useEffect(() => {
    loadShippingOptions();
  }, [loadShippingOptions]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    optionsList: {
      marginBottom: theme.spacing.lg,
    },
    optionCard: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
    },
    optionCardSelected: {
      borderColor: theme.colors.primary,
    },
    radioContainer: {
      marginRight: theme.spacing.md,
      paddingTop: 2,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterSelected: {
      borderColor: theme.colors.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    optionContent: {
      flex: 1,
    },
    optionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.xs,
    },
    optionName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    optionPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginLeft: theme.spacing.sm,
    },
    optionDescription: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    deliveryTime: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    deliveryTimeText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
    carrierBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
      alignSelf: 'flex-start',
      marginTop: theme.spacing.xs,
    },
    carrierText: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginLeft: 4,
    },
    pickupPointSection: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
    },
    pickupPointTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    pickupPointCard: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
    },
    pickupPointCardSelected: {
      borderColor: theme.colors.primary,
    },
    pickupPointContent: {
      flex: 1,
    },
    pickupPointName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    pickupPointAddress: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    pickupPointDistance: {
      fontSize: 12,
      color: theme.colors.primary,
      marginTop: theme.spacing.xs,
    },
    pickupPointHours: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    emptyContainer: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
    freeShippingBadge: {
      backgroundColor: theme.colors.success + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    freeShippingText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.success,
    },
  });

  const handleSelectOption = (option: ShippingOption) => {
    selectShippingOption(option);
    if (option.isPickupPoint) {
      setShowPickupPoints(true);
    } else {
      setShowPickupPoints(false);
    }
  };

  const handleSelectPickupPoint = (point: PickupPoint) => {
    selectPickupPoint(point);
  };

  const formatDeliveryTime = (days: { min: number; max: number }) => {
    if (days.min === days.max) {
      return days.min === 1 ? '1 business day' : `${days.min} business days`;
    }
    return `${days.min}-${days.max} business days`;
  };

  // Default pickup points for demo
  const mockPickupPoints: PickupPoint[] = [
    {
      id: 'pp1',
      name: 'Relay Point - Carrefour Market',
      address: {
        id: 'pp1-addr',
        firstName: 'Pickup',
        lastName: 'Point',
        street: '15 Rue du Commerce',
        city: 'Paris',
        postalCode: '75015',
        country: 'France',
      },
      distance: 350,
      openingHours: 'Mon-Sat: 8:00-20:00',
    },
    {
      id: 'pp2',
      name: 'Relay Point - Tabac Presse',
      address: {
        id: 'pp2-addr',
        firstName: 'Pickup',
        lastName: 'Point',
        street: '42 Avenue Felix Faure',
        city: 'Paris',
        postalCode: '75015',
        country: 'France',
      },
      distance: 520,
      openingHours: 'Mon-Sun: 7:00-21:00',
    },
    {
      id: 'pp3',
      name: 'Relay Point - Casino Shop',
      address: {
        id: 'pp3-addr',
        firstName: 'Pickup',
        lastName: 'Point',
        street: '8 Rue de la Convention',
        city: 'Paris',
        postalCode: '75015',
        country: 'France',
      },
      distance: 780,
      openingHours: 'Mon-Sat: 9:00-19:30',
    },
  ];

  const renderShippingOption = (option: ShippingOption) => {
    const isSelected = state.shippingOption?.id === option.id;
    const isFree = option.price.amount === 0;

    return (
      <TouchableOpacity
        key={option.id}
        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
        onPress={() => handleSelectOption(option)}
      >
        <View style={styles.radioContainer}>
          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
        <View style={styles.optionContent}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionName}>{option.name}</Text>
            {isFree ? (
              <View style={styles.freeShippingBadge}>
                <Text style={styles.freeShippingText}>FREE</Text>
              </View>
            ) : (
              <Text style={styles.optionPrice}>{option.price.formatted}</Text>
            )}
          </View>
          {option.description && (
            <Text style={styles.optionDescription}>{option.description}</Text>
          )}
          <View style={styles.deliveryTime}>
            <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.deliveryTimeText}>
              {formatDeliveryTime(option.estimatedDays)}
            </Text>
          </View>
          <View style={styles.carrierBadge}>
            <Ionicons name="cube-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={styles.carrierText}>{option.carrier}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPickupPoint = (point: PickupPoint) => {
    const isSelected = state.selectedPickupPoint?.id === point.id;

    return (
      <TouchableOpacity
        key={point.id}
        style={[styles.pickupPointCard, isSelected && styles.pickupPointCardSelected]}
        onPress={() => handleSelectPickupPoint(point)}
      >
        <View style={styles.radioContainer}>
          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
        <View style={styles.pickupPointContent}>
          <Text style={styles.pickupPointName}>{point.name}</Text>
          <Text style={styles.pickupPointAddress}>
            {point.address.street}, {point.address.postalCode} {point.address.city}
          </Text>
          {point.distance && (
            <Text style={styles.pickupPointDistance}>
              {point.distance < 1000
                ? `${point.distance}m away`
                : `${(point.distance / 1000).toFixed(1)}km away`}
            </Text>
          )}
          {point.openingHours && (
            <Text style={styles.pickupPointHours}>{point.openingHours}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && shippingOptions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading shipping options...</Text>
      </View>
    );
  }

  if (shippingOptions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>
          No shipping options available for your address.{'\n'}
          Please check your shipping address.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Shipping Method</Text>

      <View style={styles.optionsList}>
        {shippingOptions.map(renderShippingOption)}
      </View>

      {showPickupPoints && state.shippingOption?.isPickupPoint && (
        <View style={styles.pickupPointSection}>
          <Text style={styles.pickupPointTitle}>Select Pickup Point</Text>
          {(state.shippingOption.pickupPoints || mockPickupPoints).map(renderPickupPoint)}
        </View>
      )}
    </View>
  );
}

export default ShippingStep;

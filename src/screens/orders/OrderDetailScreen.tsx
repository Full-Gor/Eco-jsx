/**
 * Order Detail Screen
 * Shows complete order information with timeline
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useOrder } from '../../contexts/OrderContext';
import { ProfileStackScreenProps } from '../../navigation/types';
import { ExtendedOrderStatus, OrderTimelineStep } from '../../types/order';

type Props = ProfileStackScreenProps<'OrderDetails'>;

/** Status colors */
const STATUS_COLORS: Record<ExtendedOrderStatus, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  processing: '#6366F1',
  shipped: '#06B6D4',
  in_transit: '#10B981',
  out_for_delivery: '#10B981',
  delivered: '#10B981',
  cancelled: '#EF4444',
  refunded: '#F59E0B',
  return_requested: '#EF4444',
  return_in_progress: '#F59E0B',
  returned: '#6B7280',
};

export function OrderDetailScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const theme = useTheme();
  const { order, isLoading, error, cancelOrder, reorder, getTimeline } = useOrder(orderId);

  const [isCancelling, setIsCancelling] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const timeline = order ? getTimeline(order) : [];

  const handleTrackOrder = useCallback(() => {
    if (order?.tracking?.trackingNumber) {
      navigation.navigate('OrderTracking' as any, {
        orderId: order.id,
        trackingNumber: order.tracking.trackingNumber,
        carrier: order.tracking.carrier,
      });
    }
  }, [navigation, order]);

  const handleCancelOrder = useCallback(() => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            const success = await cancelOrder(orderId);
            setIsCancelling(false);
            if (success) {
              Alert.alert('Order Cancelled', 'Your order has been cancelled.');
            }
          },
        },
      ]
    );
  }, [orderId, cancelOrder]);

  const handleRequestReturn = useCallback(() => {
    navigation.navigate('RequestReturn' as any, { orderId: order?.id });
  }, [navigation, order]);

  const handleReorder = useCallback(async () => {
    setIsReordering(true);
    const success = await reorder(orderId);
    setIsReordering(false);
    if (success) {
      Alert.alert('Items Added', 'The items have been added to your cart.');
      navigation.navigate('Cart' as any);
    }
  }, [orderId, reorder, navigation]);

  const handleContactSupport = useCallback(() => {
    navigation.navigate('Help');
  }, [navigation]);

  const formatDate = (dateInput?: Date | string) => {
    if (!dateInput) return '-';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canCancel =
    order && ['pending', 'confirmed', 'processing'].includes(order.status);
  const canReturn =
    order && order.status === 'delivered';
  const canTrack =
    order && order.tracking?.trackingNumber && ['shipped', 'in_transit', 'out_for_delivery'].includes(order.status);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    backButton: {
      padding: theme.spacing.xs,
      marginRight: theme.spacing.sm,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    scrollContent: {
      padding: theme.spacing.md,
      paddingBottom: 120,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    sectionContent: {
      padding: theme.spacing.md,
    },
    orderInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    orderNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    orderDate: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    timelineContainer: {
      padding: theme.spacing.md,
    },
    timelineStep: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
    },
    timelineStepLast: {
      marginBottom: 0,
    },
    timelineIconContainer: {
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    timelineIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timelineIconCompleted: {
      backgroundColor: theme.colors.success,
    },
    timelineIconCurrent: {
      backgroundColor: theme.colors.primary,
    },
    timelineIconPending: {
      backgroundColor: theme.colors.border,
    },
    timelineLine: {
      width: 2,
      flex: 1,
      marginTop: 4,
    },
    timelineLineCompleted: {
      backgroundColor: theme.colors.success,
    },
    timelineLinePending: {
      backgroundColor: theme.colors.border,
    },
    timelineContent: {
      flex: 1,
      paddingTop: 4,
    },
    timelineTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    timelineTitleCurrent: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    timelineTitlePending: {
      color: theme.colors.textSecondary,
    },
    timelineTimestamp: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
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
      width: 50,
      height: 50,
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
    addressText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 22,
    },
    shippingMethod: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    trackingNumber: {
      fontSize: 13,
      color: theme.colors.primary,
      marginTop: 4,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
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
    },
    totalLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
    totalValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    paymentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    paymentIcon: {
      width: 40,
      height: 28,
      borderRadius: 4,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    paymentMethod: {
      fontSize: 14,
      color: theme.colors.text,
    },
    paymentDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    footerButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border,
    },
    dangerButton: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.error,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    primaryButtonText: {
      color: '#fff',
    },
    secondaryButtonText: {
      color: theme.colors.text,
    },
    dangerButtonText: {
      color: theme.colors.error,
    },
  });

  if (isLoading && !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={{ color: theme.colors.error, marginTop: theme.spacing.md }}>
            {error || 'Order not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Order Info */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <View style={styles.orderInfo}>
              <View>
                <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
                <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_COLORS[order.status] },
                ]}
              >
                <Text style={styles.statusText}>
                  {order.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Status</Text>
          </View>
          <View style={styles.timelineContainer}>
            {timeline.map((step, index) => (
              <View
                key={step.id}
                style={[
                  styles.timelineStep,
                  index === timeline.length - 1 && styles.timelineStepLast,
                ]}
              >
                <View style={styles.timelineIconContainer}>
                  <View
                    style={[
                      styles.timelineIcon,
                      step.isCompleted && !step.isCurrent && styles.timelineIconCompleted,
                      step.isCurrent && styles.timelineIconCurrent,
                      !step.isCompleted && !step.isCurrent && styles.timelineIconPending,
                    ]}
                  >
                    {step.isCompleted ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                      <Ionicons name={(step.icon as any) || 'ellipse'} size={14} color="#fff" />
                    )}
                  </View>
                  {index < timeline.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        step.isCompleted
                          ? styles.timelineLineCompleted
                          : styles.timelineLinePending,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineTitle,
                      step.isCurrent && styles.timelineTitleCurrent,
                      !step.isCompleted && !step.isCurrent && styles.timelineTitlePending,
                    ]}
                  >
                    {step.title}
                  </Text>
                  {step.timestamp && (
                    <Text style={styles.timelineTimestamp}>{formatDate(step.timestamp)}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          </View>
          <View style={styles.sectionContent}>
            {order.items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  index === order.items.length - 1 && styles.itemCardLast,
                ]}
              >
                {item.productImage ? (
                  <Image
                    source={{ uri: item.productImage }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Ionicons name="cube-outline" size={20} color={theme.colors.textSecondary} />
                  </View>
                )}
                <View style={styles.itemContent}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.productName}
                  </Text>
                  {item.variantName && (
                    <Text style={styles.itemVariant}>{item.variantName}</Text>
                  )}
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>{item.totalPrice.formatted}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.addressText}>
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              {'\n'}
              {order.shippingAddress.street}
              {order.shippingAddress.street2 ? `\n${order.shippingAddress.street2}` : ''}
              {'\n'}
              {order.shippingAddress.postalCode} {order.shippingAddress.city}
              {'\n'}
              {order.shippingAddress.country}
            </Text>
          </View>
        </View>

        {/* Shipping Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shipping Method</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.shippingMethod}>
              {order.shippingMethod?.name || 'Standard Shipping'}
            </Text>
            {order.tracking?.trackingNumber && (
              <TouchableOpacity onPress={handleTrackOrder}>
                <Text style={styles.trackingNumber}>
                  Tracking: {order.tracking.trackingNumber}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.paymentInfo}>
              <View style={styles.paymentIcon}>
                <Ionicons name="card" size={20} color={theme.colors.textSecondary} />
              </View>
              <View>
                <Text style={styles.paymentMethod}>
                  {order.payment?.brand || 'Card'} •••• {order.payment?.last4 || '****'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{order.subtotal.formatted}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>{order.shippingCost.formatted}</Text>
            </View>
            {order.discount && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, styles.summaryDiscount]}>
                  -{order.discount.amount.formatted}
                </Text>
              </View>
            )}
            {order.tax && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>{order.tax.formatted}</Text>
              </View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{order.total.formatted}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          {canTrack && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleTrackOrder}
            >
              <Ionicons name="location-outline" size={18} color="#fff" />
              <Text style={[styles.buttonText, styles.primaryButtonText]}>Track</Text>
            </TouchableOpacity>
          )}

          {canReturn && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleRequestReturn}
            >
              <Ionicons name="return-down-back-outline" size={18} color={theme.colors.text} />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Return</Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleCancelOrder}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color={theme.colors.error} />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color={theme.colors.error} />
                  <Text style={[styles.buttonText, styles.dangerButtonText]}>Cancel</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleReorder}
            disabled={isReordering}
          >
            {isReordering ? (
              <ActivityIndicator size="small" color={theme.colors.text} />
            ) : (
              <>
                <Ionicons name="cart-outline" size={18} color={theme.colors.text} />
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>Reorder</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleContactSupport}
          >
            <Ionicons name="help-circle-outline" size={18} color={theme.colors.text} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Help</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default OrderDetailScreen;

/**
 * Order History Screen
 * Lists all user orders with filters
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useOrders } from '../../contexts/OrderContext';
import { ProfileStackScreenProps } from '../../navigation/types';
import { ExtendedOrderStatus, ExtendedOrderSummary, OrderFilter } from '../../types/order';

type Props = ProfileStackScreenProps<'Orders'>;

/** Status badge colors */
const STATUS_COLORS: Record<ExtendedOrderStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  processing: { bg: '#E0E7FF', text: '#3730A3' },
  shipped: { bg: '#CFFAFE', text: '#0E7490' },
  in_transit: { bg: '#D1FAE5', text: '#065F46' },
  out_for_delivery: { bg: '#ECFDF5', text: '#047857' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  refunded: { bg: '#FEF3C7', text: '#92400E' },
  return_requested: { bg: '#FEE2E2', text: '#991B1B' },
  return_in_progress: { bg: '#FEF3C7', text: '#92400E' },
  returned: { bg: '#E5E7EB', text: '#374151' },
};

/** Status labels */
const STATUS_LABELS: Record<ExtendedOrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  return_requested: 'Return Requested',
  return_in_progress: 'Return in Progress',
  returned: 'Returned',
};

/** Filter options */
const FILTER_OPTIONS: Array<{ label: string; value: OrderFilter['status'] }> = [
  { label: 'All Orders', value: 'all' },
  { label: 'In Progress', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export function OrderHistoryScreen({ navigation }: Props) {
  const theme = useTheme();
  const {
    orders,
    isLoading,
    hasMore,
    filter,
    refreshOrders,
    loadMoreOrders,
    setFilter,
  } = useOrders();

  const [showFilterModal, setShowFilterModal] = useState(false);

  const handleOrderPress = useCallback(
    (order: ExtendedOrderSummary) => {
      navigation.navigate('OrderDetails', { orderId: order.id });
    },
    [navigation]
  );

  const handleFilterSelect = useCallback(
    (status: OrderFilter['status']) => {
      setFilter({ ...filter, status });
      setShowFilterModal(false);
    },
    [filter, setFilter]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.full,
    },
    filterButtonText: {
      fontSize: 13,
      color: theme.colors.primary,
      marginLeft: 4,
    },
    listContent: {
      padding: theme.spacing.md,
    },
    orderCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    orderNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    orderDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.full,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    orderContent: {
      flexDirection: 'row',
      padding: theme.spacing.md,
    },
    orderImage: {
      width: 60,
      height: 60,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.background,
    },
    orderImagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    orderInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    orderItemName: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 4,
    },
    orderItemCount: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    orderTotal: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
    orderFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    viewButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewButtonText: {
      fontSize: 13,
      color: theme.colors.primary,
      marginRight: 4,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    emptyIcon: {
      marginBottom: theme.spacing.md,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      paddingBottom: theme.spacing.xl,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    filterOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    filterOptionText: {
      fontSize: 15,
      color: theme.colors.text,
    },
    filterOptionSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    loadingMore: {
      paddingVertical: theme.spacing.md,
      alignItems: 'center',
    },
  });

  const renderOrder = useCallback(
    ({ item }: { item: ExtendedOrderSummary }) => {
      const statusColor = STATUS_COLORS[item.status];

      return (
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => handleOrderPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>
              <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {STATUS_LABELS[item.status]}
              </Text>
            </View>
          </View>

          <View style={styles.orderContent}>
            {item.firstItemImage ? (
              <Image
                source={{ uri: item.firstItemImage }}
                style={styles.orderImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.orderImage, styles.orderImagePlaceholder]}>
                <Ionicons name="cube-outline" size={24} color={theme.colors.textSecondary} />
              </View>
            )}
            <View style={styles.orderInfo}>
              {item.firstItemName && (
                <Text style={styles.orderItemName} numberOfLines={1}>
                  {item.firstItemName}
                </Text>
              )}
              <Text style={styles.orderItemCount}>
                {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
              </Text>
              <Text style={styles.orderTotal}>{item.total.formatted}</Text>
            </View>
          </View>

          <View style={styles.orderFooter}>
            <View style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View Details</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [styles, theme.colors, handleOrderPress]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="receipt-outline"
        size={64}
        color={theme.colors.textSecondary}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptyText}>
        When you place an order, it will appear here
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore || orders.length === 0) return null;
    return (
      <View style={styles.loadingMore}>
        <Text style={{ color: theme.colors.textSecondary }}>Loading more...</Text>
      </View>
    );
  };

  const currentFilterLabel =
    FILTER_OPTIONS.find((opt) => opt.value === filter.status)?.label || 'All Orders';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={16} color={theme.colors.primary} />
          <Text style={styles.filterButtonText}>{currentFilterLabel}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          orders.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshOrders}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Orders</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            {FILTER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.filterOption}
                onPress={() => handleFilterSelect(option.value)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filter.status === option.value && styles.filterOptionSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {filter.status === option.value && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

export default OrderHistoryScreen;

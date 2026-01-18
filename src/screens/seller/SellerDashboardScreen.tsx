/**
 * Seller Dashboard Screen
 * Main dashboard for seller to view stats, orders, and manage shop
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSellerDashboard } from '../../contexts/SellerDashboardContext';
import { useSeller } from '../../contexts/SellerContext';
import type { DashboardPeriod } from '../../types/marketplace';

interface SellerDashboardScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

/**
 * Seller Dashboard Screen Component
 */
export function SellerDashboardScreen({ navigation }: SellerDashboardScreenProps) {
  const { mySellerAccount } = useSeller();
  const {
    isLoading,
    stats,
    balance,
    alerts,
    recentOrders,
    period,
    loadDashboard,
    changePeriod,
    dismissAlert,
  } = useSellerDashboard();

  useEffect(() => {
    loadDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    loadDashboard();
  }, [loadDashboard]);

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const periodOptions: { label: string; value: DashboardPeriod }[] = [
    { label: 'Today', value: 'today' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
  ];

  if (!mySellerAccount) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No seller account found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.shopName}>{mySellerAccount.shopName}</Text>
        <Text style={styles.welcomeText}>Welcome back!</Text>
      </View>

      {/* Alerts */}
      {alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          {alerts.slice(0, 3).map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={[
                styles.alertItem,
                alert.type === 'warning' && styles.alertWarning,
                alert.type === 'error' && styles.alertError,
                alert.type === 'success' && styles.alertSuccess,
              ]}
              onPress={() => {
                if (alert.action) {
                  navigation.navigate(alert.action.route);
                }
              }}
            >
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>
              </View>
              <TouchableOpacity
                style={styles.alertDismiss}
                onPress={() => dismissAlert(alert.id)}
              >
                <Text style={styles.alertDismissText}>X</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periodOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.periodButton,
              period === option.value && styles.periodButtonActive,
            ]}
            onPress={() => changePeriod(option.value)}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === option.value && styles.periodButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Cards */}
      {stats ? (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(stats.sales.total)}</Text>
            <Text style={styles.statLabel}>Sales</Text>
            {stats.sales.change !== 0 && (
              <Text
                style={[
                  styles.statChange,
                  stats.sales.change > 0 ? styles.positiveChange : styles.negativeChange,
                ]}
              >
                {stats.sales.change > 0 ? '+' : ''}
                {stats.sales.change.toFixed(1)}%
              </Text>
            )}
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.orders.total}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.orders.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.messages.unread}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
        </View>
      ) : (
        <ActivityIndicator style={styles.loader} />
      )}

      {/* Balance Card */}
      {balance && (
        <View style={styles.balanceCard}>
          <Text style={styles.sectionTitle}>Balance</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Available</Text>
              <Text style={styles.balanceAmount}>
                {formatCurrency(balance.available)}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Pending</Text>
              <Text style={styles.balancePending}>
                {formatCurrency(balance.pending)}
              </Text>
            </View>
          </View>
          {balance.nextPayout && (
            <Text style={styles.nextPayout}>
              Next payout: {formatCurrency(balance.nextPayout.estimatedAmount)} on{' '}
              {new Date(balance.nextPayout.date).toLocaleDateString()}
            </Text>
          )}
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => navigation.navigate('SellerFinance')}
          >
            <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SellerProducts')}
          >
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionText}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SellerOrders')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SellerMessages')}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SellerSettings')}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.recentOrders}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SellerOrders')}>
            <Text style={styles.seeAllLink}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length > 0 ? (
          recentOrders.map((order) => (
            <TouchableOpacity
              key={order.subOrder.id}
              style={styles.orderItem}
              onPress={() =>
                navigation.navigate('SellerOrderDetail', {
                  subOrderId: order.subOrder.id,
                })
              }
            >
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>
                  #{order.subOrder.id.slice(-8).toUpperCase()}
                </Text>
                <Text style={styles.orderCustomer}>{order.buyer.name}</Text>
                <Text style={styles.orderItems}>
                  {order.subOrder.items.length} item(s)
                </Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>
                  {formatCurrency(order.subOrder.total)}
                </Text>
                <View
                  style={[
                    styles.orderStatus,
                    order.subOrder.status === 'pending' && styles.statusPending,
                    order.subOrder.status === 'processing' && styles.statusProcessing,
                    order.subOrder.status === 'shipped' && styles.statusShipped,
                  ]}
                >
                  <Text style={styles.orderStatusText}>{order.subOrder.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent orders</Text>
        )}
      </View>

      {/* Products Alert */}
      {stats && stats.products.outOfStock > 0 && (
        <TouchableOpacity
          style={styles.stockAlert}
          onPress={() =>
            navigation.navigate('SellerProducts', { filter: 'out_of_stock' })
          }
        >
          <Text style={styles.stockAlertText}>
            {stats.products.outOfStock} product(s) out of stock
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  alertsContainer: {
    padding: 16,
    gap: 8,
  },
  alertItem: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  alertWarning: {
    backgroundColor: '#fff3e0',
  },
  alertError: {
    backgroundColor: '#ffebee',
  },
  alertSuccess: {
    backgroundColor: '#e8f5e9',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  alertMessage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  alertDismiss: {
    padding: 8,
  },
  alertDismissText: {
    fontSize: 16,
    color: '#999',
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  periodButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statChange: {
    fontSize: 12,
    marginTop: 4,
  },
  positiveChange: {
    color: '#4CAF50',
  },
  negativeChange: {
    color: '#f44336',
  },
  loader: {
    padding: 40,
  },
  balanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  balancePending: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  nextPayout: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  withdrawButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  quickActions: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
  },
  recentOrders: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 14,
    color: '#2196F3',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  orderCustomer: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderItems: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    backgroundColor: '#e0e0e0',
  },
  statusPending: {
    backgroundColor: '#fff3e0',
  },
  statusProcessing: {
    backgroundColor: '#e3f2fd',
  },
  statusShipped: {
    backgroundColor: '#e8f5e9',
  },
  orderStatusText: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  stockAlert: {
    backgroundColor: '#ffebee',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  stockAlertText: {
    fontSize: 14,
    color: '#c62828',
    textAlign: 'center',
  },
});

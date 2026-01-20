/**
 * Vendor Dashboard Screen
 * Main dashboard showing stats, quick actions, and recent orders
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useVendorDashboard, useShop, useVendorOrders } from '../../contexts/VendorContext';
import { useAuth } from '../../contexts/AuthContext';
import { VendorOrder } from '../../types/vendor';

type IconName = keyof typeof Ionicons.glyphMap;

interface VendorDashboardScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

export function VendorDashboardScreen({ navigation }: VendorDashboardScreenProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const { stats, isLoading, getDashboardStats, refresh } = useVendorDashboard();
  const { shop, getMyShop } = useShop();
  const { orders, getMyOrders } = useVendorOrders();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      getDashboardStats(),
      getMyShop(),
      getMyOrders(),
    ]);
  };

  const onRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>
              {user?.displayName || user?.firstName || 'Vendeur'}
            </Text>
          </View>
          <View style={styles.shopBadge}>
            <Ionicons name="storefront" size={16} color={theme.colors.primary} />
            <Text style={styles.shopName}>{shop?.name || 'Ma Boutique'}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        {isLoading && !stats ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <TouchableOpacity
              style={[styles.statCard, styles.statCardPrimary]}
              onPress={() => navigation.navigate('MyProducts')}
            >
              <Ionicons name="cube" size={28} color="#fff" />
              <Text style={styles.statValueLight}>{stats?.totalProducts || 0}</Text>
              <Text style={styles.statLabelLight}>Produits</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, styles.statCardWarning]}
              onPress={() => navigation.navigate('VendorOrders')}
            >
              <Ionicons name="time" size={28} color="#fff" />
              <Text style={styles.statValueLight}>{stats?.pendingOrders || 0}</Text>
              <Text style={styles.statLabelLight}>En attente</Text>
            </TouchableOpacity>

            <View style={[styles.statCard, styles.statCardSuccess]}>
              <Ionicons name="cash" size={28} color="#fff" />
              <Text style={styles.statValueLight}>
                {formatCurrency(stats?.totalSales || 0)}
              </Text>
              <Text style={styles.statLabelLight}>Ventes totales</Text>
            </View>

            <View style={[styles.statCard, styles.statCardInfo]}>
              <Ionicons name="trending-up" size={28} color="#fff" />
              <Text style={styles.statValueLight}>
                {formatCurrency(stats?.monthSales || 0)}
              </Text>
              <Text style={styles.statLabelLight}>Ce mois</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('MyProducts', { screen: 'AddProduct' })}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.actionText}>Ajouter produit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('MyShop')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons name="storefront" size={24} color={theme.colors.success} />
              </View>
              <Text style={styles.actionText}>Ma boutique</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('VendorOrders')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                <Ionicons name="receipt" size={24} color={theme.colors.warning} />
              </View>
              <Text style={styles.actionText}>Commandes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('MyProducts')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.info + '20' }]}>
                <Ionicons name="cube" size={24} color={theme.colors.info} />
              </View>
              <Text style={styles.actionText}>Produits</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alerts */}
        {stats && stats.lowStockProducts > 0 && (
          <TouchableOpacity
            style={styles.alertCard}
            onPress={() => navigation.navigate('MyProducts')}
          >
            <View style={styles.alertIconContainer}>
              <Ionicons name="warning" size={24} color={theme.colors.warning} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Stock bas</Text>
              <Text style={styles.alertMessage}>
                {stats.lowStockProducts} produit(s) avec un stock faible
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Commandes recentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('VendorOrders')}>
              <Text style={styles.seeAllLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {pendingOrders.length > 0 ? (
            pendingOrders.slice(0, 5).map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                theme={theme}
                onPress={() => navigation.navigate('VendorOrders', { orderId: order.id })}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={styles.emptyText}>Aucune commande en attente</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Order Card Component */
interface OrderCardProps {
  order: VendorOrder;
  theme: ReturnType<typeof useTheme>;
  onPress: () => void;
}

function OrderCard({ order, theme, onPress }: OrderCardProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.warning;
      case 'confirmed': return theme.colors.info;
      case 'processing': return theme.colors.info;
      case 'shipped': return theme.colors.success;
      case 'delivered': return theme.colors.success;
      case 'cancelled': return theme.colors.error;
      case 'refunded': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmee';
      case 'processing': return 'En cours';
      case 'shipped': return 'Expediee';
      case 'delivered': return 'Livree';
      case 'cancelled': return 'Annulee';
      case 'refunded': return 'Remboursee';
      default: return status;
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    orderNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    cardBody: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    customerInfo: {
      flex: 1,
    },
    customerName: {
      fontSize: 14,
      color: theme.colors.text,
    },
    itemsCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    orderTotal: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
    },
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>
          #{order.orderNumber || order.id.slice(-8).toUpperCase()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>
            {order.clientName || 'Client'}
          </Text>
          <Text style={styles.itemsCount}>
            {order.items.length} article(s)
          </Text>
        </View>
        <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    greeting: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
    },
    shopBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary + '15',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    shopName: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    loaderContainer: {
      padding: 40,
      alignItems: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      minWidth: '45%',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
    },
    statCardPrimary: {
      backgroundColor: theme.colors.primary,
    },
    statCardWarning: {
      backgroundColor: theme.colors.warning,
    },
    statCardSuccess: {
      backgroundColor: theme.colors.success,
    },
    statCardInfo: {
      backgroundColor: theme.colors.info,
    },
    statValueLight: {
      fontSize: 24,
      fontWeight: '700',
      color: '#fff',
      marginTop: 8,
    },
    statLabelLight: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
      marginTop: 4,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    seeAllLink: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    actionText: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.colors.text,
      textAlign: 'center',
    },
    alertCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.warning + '15',
      marginHorizontal: 20,
      marginBottom: 24,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    alertIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.warning + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    alertContent: {
      flex: 1,
    },
    alertTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    alertMessage: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textTertiary,
      marginTop: 12,
    },
  });

export default VendorDashboardScreen;

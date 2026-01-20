/**
 * Vendor Orders Screen
 * View and manage vendor's orders
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useVendorOrders } from '../../contexts/VendorContext';
import { VendorOrder, VendorOrderStatus } from '../../types/vendor';

interface VendorOrdersScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  route: {
    params?: {
      orderId?: string;
    };
  };
}

type FilterStatus = 'all' | VendorOrderStatus;

export function VendorOrdersScreen({ navigation, route }: VendorOrdersScreenProps) {
  const theme = useTheme();
  const { orders, isLoading, getMyOrders, updateOrderStatus } = useVendorOrders();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (route.params?.orderId) {
      const order = orders.find(o => o.id === route.params?.orderId);
      if (order) {
        setSelectedOrder(order);
        setShowOrderModal(true);
      }
    }
  }, [route.params?.orderId, orders]);

  const loadOrders = async () => {
    await getMyOrders();
  };

  const onRefresh = useCallback(async () => {
    await loadOrders();
  }, []);

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateValue: Date | string | undefined): string => {
    if (!dateValue) return '';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusLabel = (status: VendorOrderStatus) => {
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

  const getStatusColor = (status: VendorOrderStatus) => {
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

  const handleStatusChange = async (order: VendorOrder, newStatus: VendorOrderStatus) => {
    if (newStatus === 'shipped') {
      setSelectedOrder(order);
      setShowShipModal(true);
      return;
    }

    setIsUpdating(true);
    const success = await updateOrderStatus(order.id, newStatus);
    setIsUpdating(false);

    if (success) {
      Alert.alert('Succes', 'Statut mis a jour');
    } else {
      Alert.alert('Erreur', 'Impossible de mettre a jour le statut');
    }
  };

  const handleShip = async () => {
    if (!selectedOrder) return;

    if (!trackingNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un numero de suivi');
      return;
    }

    setIsUpdating(true);
    const success = await updateOrderStatus(
      selectedOrder.id,
      'shipped',
      trackingNumber,
      carrier
    );
    setIsUpdating(false);

    if (success) {
      setShowShipModal(false);
      setTrackingNumber('');
      setCarrier('');
      Alert.alert('Succes', 'Commande marquee comme expediee');
    } else {
      Alert.alert('Erreur', 'Impossible de mettre a jour le statut');
    }
  };

  const getNextActions = (status: VendorOrderStatus): VendorOrderStatus[] => {
    switch (status) {
      case 'pending': return ['confirmed', 'cancelled'];
      case 'confirmed': return ['processing', 'cancelled'];
      case 'processing': return ['shipped'];
      case 'shipped': return ['delivered'];
      default: return [];
    }
  };

  const styles = createStyles(theme);

  const renderOrder = ({ item }: { item: VendorOrder }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setShowOrderModal(true);
      }}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>
            #{item.orderNumber || item.id.slice(-8).toUpperCase()}
          </Text>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderBody}>
        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.customerName}>{item.clientName || 'Client'}</Text>
        </View>
        <View style={styles.itemsInfo}>
          <Ionicons name="cube-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.itemsText}>{item.items.length} article(s)</Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>{formatCurrency(item.total)}</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={theme.colors.textTertiary} />
      <Text style={styles.emptyTitle}>Aucune commande</Text>
      <Text style={styles.emptySubtitle}>
        Vos commandes apparaitront ici
      </Text>
    </View>
  );

  const filterOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirmees' },
    { value: 'processing', label: 'En cours' },
    { value: 'shipped', label: 'Expediees' },
    { value: 'delivered', label: 'Livrees' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Commandes</Text>
        <Text style={styles.subtitle}>{orders.length} commande(s)</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                filterStatus === item.value && styles.filterTabActive,
              ]}
              onPress={() => setFilterStatus(item.value)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filterStatus === item.value && styles.filterTabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Order Detail Modal */}
      <Modal
        visible={showOrderModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Commande #{selectedOrder?.orderNumber || selectedOrder?.id.slice(-8).toUpperCase()}
            </Text>
            <TouchableOpacity onPress={() => setShowOrderModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {selectedOrder && (
            <FlatList
              data={[selectedOrder]}
              keyExtractor={() => 'order-detail'}
              renderItem={() => (
                <View style={styles.modalContent}>
                  {/* Status */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Statut</Text>
                    <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
                      <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedOrder.status) }]}>
                        {getStatusLabel(selectedOrder.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Customer */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Client</Text>
                    <Text style={styles.detailValue}>{selectedOrder.clientName || 'Client'}</Text>
                    {selectedOrder.clientEmail && (
                      <Text style={styles.detailSubvalue}>{selectedOrder.clientEmail}</Text>
                    )}
                  </View>

                  {/* Shipping Address */}
                  {selectedOrder.shippingAddress && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Adresse de livraison</Text>
                      <Text style={styles.detailValue}>
                        {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                      </Text>
                      <Text style={styles.detailSubvalue}>
                        {selectedOrder.shippingAddress.address1}
                        {selectedOrder.shippingAddress.address2 && `, ${selectedOrder.shippingAddress.address2}`}
                      </Text>
                      <Text style={styles.detailSubvalue}>
                        {selectedOrder.shippingAddress.postalCode} {selectedOrder.shippingAddress.city}
                      </Text>
                      <Text style={styles.detailSubvalue}>
                        {selectedOrder.shippingAddress.country}
                      </Text>
                    </View>
                  )}

                  {/* Items */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Articles</Text>
                    {selectedOrder.items.map((item, index) => (
                      <View key={index} style={styles.orderItem}>
                        <View style={styles.orderItemInfo}>
                          <Text style={styles.orderItemName}>{item.productName}</Text>
                          <Text style={styles.orderItemQty}>x{item.quantity}</Text>
                        </View>
                        <Text style={styles.orderItemPrice}>{formatCurrency(item.total)}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Totals */}
                  <View style={styles.totalsSection}>
                    {selectedOrder.subtotal && (
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Sous-total</Text>
                        <Text style={styles.totalValue}>{formatCurrency(selectedOrder.subtotal)}</Text>
                      </View>
                    )}
                    {selectedOrder.shippingCost && (
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Livraison</Text>
                        <Text style={styles.totalValue}>{formatCurrency(selectedOrder.shippingCost)}</Text>
                      </View>
                    )}
                    <View style={[styles.totalRow, styles.grandTotal]}>
                      <Text style={styles.grandTotalLabel}>Total</Text>
                      <Text style={styles.grandTotalValue}>{formatCurrency(selectedOrder.total)}</Text>
                    </View>
                  </View>

                  {/* Tracking */}
                  {selectedOrder.trackingNumber && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Suivi</Text>
                      <Text style={styles.detailValue}>{selectedOrder.trackingNumber}</Text>
                      {selectedOrder.carrier && (
                        <Text style={styles.detailSubvalue}>{selectedOrder.carrier}</Text>
                      )}
                    </View>
                  )}

                  {/* Actions */}
                  {getNextActions(selectedOrder.status).length > 0 && (
                    <View style={styles.actionsSection}>
                      <Text style={styles.detailLabel}>Actions</Text>
                      <View style={styles.actionButtons}>
                        {getNextActions(selectedOrder.status).map((action) => (
                          <TouchableOpacity
                            key={action}
                            style={[
                              styles.actionButton,
                              action === 'cancelled' && styles.actionButtonDanger,
                            ]}
                            onPress={() => handleStatusChange(selectedOrder, action)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.actionButtonText}>
                                {getStatusLabel(action)}
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Ship Modal */}
      <Modal
        visible={showShipModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowShipModal(false)}
      >
        <View style={styles.shipModalOverlay}>
          <View style={styles.shipModalContent}>
            <Text style={styles.shipModalTitle}>Expedier la commande</Text>

            <Text style={styles.inputLabel}>Numero de suivi *</Text>
            <TextInput
              style={styles.input}
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholder="Ex: 1Z999AA10123456784"
              placeholderTextColor={theme.colors.textTertiary}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Transporteur</Text>
            <TextInput
              style={styles.input}
              value={carrier}
              onChangeText={setCarrier}
              placeholder="Ex: UPS, DHL, Colissimo..."
              placeholderTextColor={theme.colors.textTertiary}
            />

            <View style={styles.shipModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowShipModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleShip}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    filterContainer: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    filterList: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      marginRight: 8,
    },
    filterTabActive: {
      backgroundColor: theme.colors.primary,
    },
    filterTabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    filterTabTextActive: {
      color: '#fff',
    },
    listContent: {
      padding: 16,
      paddingBottom: 100,
    },
    orderCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    orderNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    orderDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    orderBody: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 12,
    },
    customerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    customerName: {
      fontSize: 14,
      color: theme.colors.text,
    },
    itemsInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    itemsText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    orderFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    orderTotal: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    separator: {
      height: 12,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 8,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    modalContent: {
      padding: 20,
    },
    detailSection: {
      marginBottom: 24,
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    detailValue: {
      fontSize: 16,
      color: theme.colors.text,
    },
    detailSubvalue: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    statusBadgeLarge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    statusTextLarge: {
      fontSize: 14,
      fontWeight: '600',
    },
    orderItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    orderItemInfo: {
      flex: 1,
    },
    orderItemName: {
      fontSize: 14,
      color: theme.colors.text,
    },
    orderItemQty: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    orderItemPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    totalsSection: {
      marginBottom: 24,
      paddingTop: 12,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    totalLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    totalValue: {
      fontSize: 14,
      color: theme.colors.text,
    },
    grandTotal: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: 8,
      paddingTop: 16,
    },
    grandTotalLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    grandTotalValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    actionsSection: {
      marginTop: 12,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    actionButtonDanger: {
      backgroundColor: theme.colors.error,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    shipModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    shipModalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 40,
    },
    shipModalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    shipModalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });

export default VendorOrdersScreen;

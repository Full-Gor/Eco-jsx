/**
 * My Products Screen
 * List and manage vendor's products
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useVendorProducts } from '../../contexts/VendorContext';
import { VendorProduct, VendorProductStatus } from '../../types/vendor';

interface MyProductsScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

type FilterStatus = 'all' | VendorProductStatus;

export function MyProductsScreen({ navigation }: MyProductsScreenProps) {
  const theme = useTheme();
  const { products, isLoading, getMyProducts, deleteProduct } = useVendorProducts();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    await getMyProducts();
  };

  const onRefresh = useCallback(async () => {
    await loadProducts();
  }, []);

  const filteredProducts = filterStatus === 'all'
    ? products
    : products.filter(p => p.status === filterStatus);

  const handleDelete = (product: VendorProduct) => {
    Alert.alert(
      'Supprimer le produit',
      `Etes-vous sur de vouloir supprimer "${product.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(product.id);
            const success = await deleteProduct(product.id);
            setIsDeleting(null);
            if (!success) {
              Alert.alert('Erreur', 'Impossible de supprimer le produit');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusLabel = (status: VendorProductStatus) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'draft': return 'Brouillon';
      case 'paused': return 'En pause';
      case 'out_of_stock': return 'Rupture';
      case 'archived': return 'Archive';
      default: return status;
    }
  };

  const getStatusColor = (status: VendorProductStatus) => {
    switch (status) {
      case 'active': return theme.colors.success;
      case 'draft': return theme.colors.textSecondary;
      case 'paused': return theme.colors.warning;
      case 'out_of_stock': return theme.colors.error;
      case 'archived': return theme.colors.textTertiary;
      default: return theme.colors.textSecondary;
    }
  };

  const styles = createStyles(theme);

  const renderProduct = ({ item }: { item: VendorProduct }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('EditProduct', { productId: item.id })}
    >
      <View style={styles.productImageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="cube-outline" size={32} color={theme.colors.textTertiary} />
          </View>
        )}
        {item.stock <= 5 && item.stock > 0 && (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>Stock bas</Text>
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>

        <View style={styles.productMeta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <Text style={styles.stockText}>
            <Ionicons name="cube-outline" size={12} color={theme.colors.textSecondary} />
            {' '}{item.stock} en stock
          </Text>
        </View>
      </View>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditProduct', { productId: item.id })}
        >
          <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
          disabled={isDeleting === item.id}
        >
          {isDeleting === item.id ? (
            <ActivityIndicator size="small" color={theme.colors.error} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color={theme.colors.textTertiary} />
      <Text style={styles.emptyTitle}>Aucun produit</Text>
      <Text style={styles.emptySubtitle}>
        Commencez par ajouter votre premier produit
      </Text>
      <TouchableOpacity
        style={styles.addButtonLarge}
        onPress={() => navigation.navigate('AddProduct')}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonLargeText}>Ajouter un produit</Text>
      </TouchableOpacity>
    </View>
  );

  const filterOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'Tous' },
    { value: 'active', label: 'Actifs' },
    { value: 'draft', label: 'Brouillons' },
    { value: 'paused', label: 'En pause' },
    { value: 'out_of_stock', label: 'Rupture' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mes Produits</Text>
          <Text style={styles.subtitle}>{products.length} produit(s)</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
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

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
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
    productCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    productImageContainer: {
      width: 80,
      height: 80,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: theme.colors.background,
    },
    productImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    productImagePlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    lowStockBadge: {
      position: 'absolute',
      bottom: 4,
      left: 4,
      right: 4,
      backgroundColor: theme.colors.warning,
      paddingVertical: 2,
      borderRadius: 4,
    },
    lowStockText: {
      fontSize: 9,
      fontWeight: '600',
      color: '#fff',
      textAlign: 'center',
    },
    productInfo: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'center',
    },
    productName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    productPrice: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 8,
    },
    productMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
    },
    stockText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    productActions: {
      justifyContent: 'center',
      gap: 8,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteButton: {
      backgroundColor: theme.colors.error + '15',
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
      textAlign: 'center',
    },
    addButtonLarge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 24,
      gap: 8,
    },
    addButtonLargeText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });

export default MyProductsScreen;

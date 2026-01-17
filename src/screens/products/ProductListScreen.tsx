/**
 * Product List Screen
 * Displays products in grid or list view with filtering and sorting
 */

import React, { useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useProducts, useCatalog } from '../../hooks';
import { Product, ProductSortOption } from '../../types/product';
import { ProductCard } from '../../components/product/ProductCard';
import { Header, Skeleton } from '../../components/common';
import { HomeStackParamList } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ProductListRouteProp = RouteProp<HomeStackParamList, 'ProductList'>;
type ProductListNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ProductList'>;

/** Sort options */
const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'rating', label: 'Mieux notés' },
  { value: 'popularity', label: 'Popularité' },
];

export function ProductListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProductListNavigationProp>();
  const route = useRoute<ProductListRouteProp>();

  const { categoryId, categoryName, searchQuery } = route.params || {};

  const {
    products,
    loading,
    refreshing,
    error,
    hasMore,
    filters,
    sort,
    viewMode,
    refreshProducts,
    loadMoreProducts,
    setSort,
    setViewMode,
    setFilters,
  } = useProducts();

  const { addToFavorites, removeFromFavorites, isFavorite } = useCatalog();

  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Set category filter if provided
  React.useEffect(() => {
    if (categoryId) {
      setFilters({ categoryId });
    }
  }, [categoryId, setFilters]);

  /** Handle product press */
  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  }, [navigation]);

  /** Handle add to cart */
  const handleAddToCart = useCallback((product: Product) => {
    // TODO: Implement add to cart
    console.log('Add to cart:', product.id);
  }, []);

  /** Handle toggle favorite */
  const handleToggleFavorite = useCallback(async (product: Product) => {
    if (isFavorite(product.id)) {
      await removeFromFavorites(product.id);
    } else {
      await addToFavorites(product.id);
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);

  /** Handle sort change */
  const handleSortChange = useCallback((newSort: ProductSortOption) => {
    setSort(newSort);
    setShowSortModal(false);
  }, [setSort]);

  /** Toggle view mode */
  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  }, [viewMode, setViewMode]);

  /** Render product item */
  const renderProduct = useCallback(({ item, index }: { item: Product; index: number }) => (
    <View style={[
      styles.productItem,
      viewMode === 'grid' && { marginLeft: index % 2 === 0 ? 0 : 8 },
    ]}>
      <ProductCard
        product={item}
        viewMode={viewMode}
        onPress={handleProductPress}
        onAddToCart={handleAddToCart}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={isFavorite(item.id)}
      />
    </View>
  ), [viewMode, handleProductPress, handleAddToCart, handleToggleFavorite, isFavorite]);

  /** Render empty state */
  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cube-outline" size={64} color={theme.colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          Aucun produit trouvé
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
          Essayez de modifier vos filtres ou votre recherche
        </Text>
      </View>
    );
  };

  /** Render footer (loading more) */
  const renderFooter = () => {
    if (!hasMore || loading) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  /** Render skeleton loading */
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {viewMode === 'grid' ? (
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.skeletonGridItem}>
              <Skeleton width={(SCREEN_WIDTH - 48) / 2} height={(SCREEN_WIDTH - 48) / 2} borderRadius={12} />
              <View style={{ padding: 12 }}>
                <Skeleton width="100%" height={16} borderRadius={4} />
                <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
                <Skeleton width="40%" height={18} borderRadius={4} style={{ marginTop: 8 }} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        [1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.skeletonListItem}>
            <Skeleton width={100} height={100} borderRadius={8} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Skeleton width="80%" height={16} borderRadius={4} />
              <Skeleton width="100%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
              <Skeleton width="40%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
              <Skeleton width="30%" height={18} borderRadius={4} style={{ marginTop: 8 }} />
            </View>
          </View>
        ))
      )}
    </View>
  );

  /** Get active filter count */
  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== null).length;

  /** Get current sort label */
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || 'Pertinence';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Header
        title={categoryName || searchQuery || 'Produits'}
        showBack
        rightComponent={
          <TouchableOpacity onPress={() => navigation.navigate('Search' as never)}>
            <Ionicons name="search" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        }
      />

      {/* Toolbar */}
      <View style={[styles.toolbar, { borderBottomColor: theme.colors.border }]}>
        {/* Sort button */}
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.toolbarButtonText, { color: theme.colors.text }]}>
            {currentSortLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Divider */}
        <View style={[styles.toolbarDivider, { backgroundColor: theme.colors.border }]} />

        {/* Filter button */}
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.toolbarButtonText, { color: theme.colors.text }]}>
            Filtres
          </Text>
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={[styles.toolbarDivider, { backgroundColor: theme.colors.border }]} />

        {/* View mode toggle */}
        <TouchableOpacity style={styles.viewModeButton} onPress={toggleViewMode}>
          <Ionicons
            name={viewMode === 'grid' ? 'grid' : 'list'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Product count */}
      {!loading && products.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
            {products.length} produit{products.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Products list */}
      {loading && products.length === 0 ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: theme.spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshProducts}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        />
      )}

      {/* Sort Modal */}
      {showSortModal && (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Trier par
            </Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  sort === option.value && { backgroundColor: theme.colors.primary + '10' },
                ]}
                onPress={() => handleSortChange(option.value)}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    { color: sort === option.value ? theme.colors.primary : theme.colors.text },
                  ]}
                >
                  {option.label}
                </Text>
                {sort === option.value && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolbarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 6,
  },
  toolbarDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 12,
  },
  viewModeButton: {
    padding: 4,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 13,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  productItem: {
    marginBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skeletonGridItem: {
    width: (SCREEN_WIDTH - 48) / 2,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  skeletonListItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 34,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  sortOptionText: {
    fontSize: 16,
  },
});

export default ProductListScreen;

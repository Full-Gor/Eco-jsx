/**
 * Wishlist Screen
 * Displays user's favorite products
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWishlist } from '../../contexts/WishlistContext';
import { ExtendedWishlistItem, WishlistSort } from '../../types/engagement';

/** Sort options */
const SORT_OPTIONS: { value: WishlistSort; label: string }[] = [
  { value: 'date_added', label: 'Recently Added' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name' },
];

export function WishlistScreen() {
  const navigation = useNavigation<any>();
  const {
    items,
    lists,
    currentList,
    isLoading,
    isSyncing,
    removeFromWishlist,
    clearWishlist,
    setCurrentList,
    sortItems,
    refreshWishlist,
  } = useWishlist();

  const [sortBy, setSortBy] = useState<WishlistSort>('date_added');
  const [showSortMenu, setShowSortMenu] = useState(false);

  /** Get sorted items */
  const sortedItems = useMemo(() => sortItems(sortBy), [sortItems, sortBy]);

  /** Handle product press */
  const handleProductPress = useCallback(
    (item: ExtendedWishlistItem) => {
      navigation.navigate('ProductDetail', {
        productId: item.productId,
        variantId: item.variantId,
      });
    },
    [navigation]
  );

  /** Handle add to cart */
  const handleAddToCart = useCallback(
    (item: ExtendedWishlistItem) => {
      // Navigate to product with add to cart action
      navigation.navigate('ProductDetail', {
        productId: item.productId,
        variantId: item.variantId,
        addToCart: true,
      });
    },
    [navigation]
  );

  /** Handle remove from wishlist */
  const handleRemove = useCallback(
    (item: ExtendedWishlistItem) => {
      Alert.alert(
        'Remove from Wishlist',
        `Remove "${item.productName || 'this item'}" from your wishlist?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeFromWishlist(item.productId, item.variantId),
          },
        ]
      );
    },
    [removeFromWishlist]
  );

  /** Handle clear all */
  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to remove all items from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearWishlist(currentList?.id),
        },
      ]
    );
  }, [clearWishlist, currentList?.id]);

  /** Render wishlist item */
  const renderItem = useCallback(
    ({ item }: { item: ExtendedWishlistItem }) => {
      const hasDiscount =
        item.currentPrice &&
        item.currentPrice.amount < item.priceAtAdd.amount;
      const isOutOfStock = item.currentlyInStock === false;

      return (
        <TouchableOpacity
          style={styles.itemCard}
          onPress={() => handleProductPress(item)}
          activeOpacity={0.7}
        >
          {/* Product Image */}
          <View style={styles.imageContainer}>
            {item.productImage ? (
              <Image
                source={{ uri: item.productImage }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderIcon}>image</Text>
              </View>
            )}

            {/* Out of stock badge */}
            {isOutOfStock && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}

            {/* Price drop badge */}
            {hasDiscount && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceBadgeText}>Price Drop!</Text>
              </View>
            )}
          </View>

          {/* Product Info */}
          <View style={styles.itemContent}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.productName || 'Product'}
            </Text>

            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={[styles.currentPrice, hasDiscount && styles.discountedPrice]}>
                {item.currentPrice?.formatted || item.priceAtAdd.formatted}
              </Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>{item.priceAtAdd.formatted}</Text>
              )}
            </View>

            {/* Actions */}
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.addToCartButton]}
                onPress={() => handleAddToCart(item)}
                disabled={isOutOfStock}
              >
                <Text style={styles.addToCartText}>
                  {isOutOfStock ? 'Notify Me' : 'Add to Cart'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemove(item)}
              >
                <Text style={styles.removeIcon}>trash-2</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [handleProductPress, handleAddToCart, handleRemove]
  );

  /** Empty state */
  const renderEmptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>heart</Text>
        <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
        <Text style={styles.emptySubtitle}>
          Save items you love by tapping the heart icon on any product
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('Shop')}
        >
          <Text style={styles.browseButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    ),
    [navigation]
  );

  /** Header with sort and lists */
  const renderHeader = useMemo(
    () => (
      <View style={styles.header}>
        {/* Lists tabs */}
        {lists.length > 0 && (
          <View style={styles.listTabs}>
            <TouchableOpacity
              style={[styles.listTab, !currentList && styles.activeListTab]}
              onPress={() => setCurrentList(null)}
            >
              <Text
                style={[styles.listTabText, !currentList && styles.activeListTabText]}
              >
                All ({items.length})
              </Text>
            </TouchableOpacity>
            {lists.map((list) => (
              <TouchableOpacity
                key={list.id}
                style={[
                  styles.listTab,
                  currentList?.id === list.id && styles.activeListTab,
                ]}
                onPress={() => setCurrentList(list.id)}
              >
                <Text
                  style={[
                    styles.listTabText,
                    currentList?.id === list.id && styles.activeListTabText,
                  ]}
                >
                  {list.name} ({list.itemCount})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Sort and actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Text style={styles.sortIcon}>sliders</Text>
            <Text style={styles.sortText}>
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            </Text>
          </TouchableOpacity>

          {sortedItems.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sort menu */}
        {showSortMenu && (
          <View style={styles.sortMenu}>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  sortBy === option.value && styles.activeSortOption,
                ]}
                onPress={() => {
                  setSortBy(option.value);
                  setShowSortMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option.value && styles.activeSortOptionText,
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Text style={styles.checkIcon}>check</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    ),
    [
      lists,
      currentList,
      items.length,
      sortBy,
      showSortMenu,
      sortedItems.length,
      setCurrentList,
      handleClearAll,
    ]
  );

  return (
    <View style={styles.container}>
      {renderHeader}
      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={
          sortedItems.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isSyncing}
            onRefresh={refreshWishlist}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  listTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  listTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeListTab: {
    backgroundColor: '#111827',
  },
  listTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeListTabText: {
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sortIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  sortText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  sortMenu: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activeSortOption: {
    backgroundColor: '#F3F4F6',
  },
  sortOptionText: {
    fontSize: 15,
    color: '#374151',
  },
  activeSortOptionText: {
    fontWeight: '600',
    color: '#111827',
  },
  checkIcon: {
    fontSize: 16,
    color: '#3B82F6',
  },
  listContainer: {
    padding: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imageContainer: {
    aspectRatio: 1,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    color: '#D1D5DB',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfStockText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemContent: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  discountedPrice: {
    color: '#EF4444',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartButton: {
    backgroundColor: '#111827',
  },
  addToCartText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 18,
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    color: '#D1D5DB',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default WishlistScreen;

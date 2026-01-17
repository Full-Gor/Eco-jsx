/**
 * Product Card Component
 * Displays product information in grid or list view
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../theme';
import { Product } from '../../types/product';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onPress?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleFavorite?: (product: Product) => void;
  isFavorite?: boolean;
}

function ProductCardComponent({
  product,
  viewMode = 'grid',
  onPress,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
}: ProductCardProps) {
  const theme = useTheme();
  const styles = createStyles(theme.colors, viewMode);

  const hasDiscount = product.compareAtPrice && product.compareAtPrice.amount > product.price.amount;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice!.amount - product.price.amount) / product.compareAtPrice!.amount) * 100)
    : 0;

  const isOutOfStock = product.stock <= 0;
  const isNew = product.isNew;

  const handlePress = () => {
    onPress?.(product);
  };

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      onAddToCart?.(product);
    }
  };

  const handleToggleFavorite = () => {
    onToggleFavorite?.(product);
  };

  const imageSource = product.thumbnail?.url || product.images?.[0]?.url;

  if (viewMode === 'list') {
    return (
      <TouchableOpacity
        style={[styles.listContainer, { backgroundColor: theme.colors.card }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Image */}
        <View style={styles.listImageContainer}>
          {imageSource ? (
            <Image source={{ uri: imageSource }} style={styles.listImage} resizeMode="cover" />
          ) : (
            <View style={[styles.listImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={32} color={theme.colors.textTertiary} />
            </View>
          )}

          {/* Badges */}
          {isOutOfStock && (
            <View style={[styles.badge, styles.outOfStockBadge]}>
              <Text style={styles.badgeText}>Rupture</Text>
            </View>
          )}
          {!isOutOfStock && hasDiscount && (
            <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
              <Text style={styles.badgeText}>-{discountPercent}%</Text>
            </View>
          )}
          {!isOutOfStock && !hasDiscount && isNew && (
            <View style={[styles.badge, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.badgeText}>Nouveau</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.listContent}>
          <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={2}>
            {product.name}
          </Text>

          {product.shortDescription && (
            <Text style={[styles.listDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {product.shortDescription}
            </Text>
          )}

          {/* Rating */}
          {product.rating && product.rating.count > 0 && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFC107" />
              <Text style={[styles.ratingText, { color: theme.colors.textSecondary }]}>
                {product.rating.average.toFixed(1)} ({product.rating.count})
              </Text>
            </View>
          )}

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: theme.colors.primary }]}>
              {product.price.formatted || `${product.price.amount} ${product.price.currency}`}
            </Text>
            {hasDiscount && (
              <Text style={[styles.comparePrice, { color: theme.colors.textTertiary }]}>
                {product.compareAtPrice?.formatted || `${product.compareAtPrice?.amount} ${product.compareAtPrice?.currency}`}
              </Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.listActions}>
          <TouchableOpacity
            style={[styles.favoriteButton, { borderColor: theme.colors.border }]}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? theme.colors.error : theme.colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              {
                backgroundColor: isOutOfStock ? theme.colors.surfaceDisabled : theme.colors.primary,
              },
            ]}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
          >
            <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // Grid view
  return (
    <TouchableOpacity
      style={[styles.gridContainer, { backgroundColor: theme.colors.card }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.gridImageContainer}>
        {imageSource ? (
          <Image source={{ uri: imageSource }} style={styles.gridImage} resizeMode="cover" />
        ) : (
          <View style={[styles.gridImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={40} color={theme.colors.textTertiary} />
          </View>
        )}

        {/* Favorite button */}
        <TouchableOpacity
          style={[styles.gridFavoriteButton, { backgroundColor: theme.colors.card }]}
          onPress={handleToggleFavorite}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? theme.colors.error : theme.colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Badges */}
        {isOutOfStock && (
          <View style={[styles.gridBadge, styles.outOfStockBadge]}>
            <Text style={styles.badgeText}>Rupture</Text>
          </View>
        )}
        {!isOutOfStock && hasDiscount && (
          <View style={[styles.gridBadge, { backgroundColor: theme.colors.error }]}>
            <Text style={styles.badgeText}>-{discountPercent}%</Text>
          </View>
        )}
        {!isOutOfStock && !hasDiscount && isNew && (
          <View style={[styles.gridBadge, { backgroundColor: theme.colors.success }]}>
            <Text style={styles.badgeText}>Nouveau</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.gridContent}>
        <Text style={[styles.productName, { color: theme.colors.text }]} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Rating */}
        {product.rating && product.rating.count > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFC107" />
            <Text style={[styles.ratingTextSmall, { color: theme.colors.textSecondary }]}>
              {product.rating.average.toFixed(1)}
            </Text>
          </View>
        )}

        {/* Price */}
        <View style={styles.gridPriceRow}>
          <View style={styles.priceContainer}>
            <Text style={[styles.gridPrice, { color: theme.colors.primary }]}>
              {product.price.formatted || `${product.price.amount}`}
            </Text>
            {hasDiscount && (
              <Text style={[styles.gridComparePrice, { color: theme.colors.textTertiary }]}>
                {product.compareAtPrice?.formatted || `${product.compareAtPrice?.amount}`}
              </Text>
            )}
          </View>

          {/* Add to cart */}
          <TouchableOpacity
            style={[
              styles.gridAddToCartButton,
              {
                backgroundColor: isOutOfStock ? theme.colors.surfaceDisabled : theme.colors.primary,
              },
            ]}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors, viewMode: 'grid' | 'list') =>
  StyleSheet.create({
    // List view styles
    listContainer: {
      flexDirection: 'row',
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    listImageContainer: {
      width: 100,
      height: 100,
      borderRadius: 8,
      overflow: 'hidden',
    },
    listImage: {
      width: '100%',
      height: '100%',
    },
    listContent: {
      flex: 1,
      marginHorizontal: 12,
      justifyContent: 'center',
    },
    listDescription: {
      fontSize: 12,
      marginTop: 4,
      lineHeight: 16,
    },
    listActions: {
      justifyContent: 'space-between',
      paddingVertical: 4,
    },

    // Grid view styles
    gridContainer: {
      width: GRID_ITEM_WIDTH,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      overflow: 'hidden',
    },
    gridImageContainer: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: colors.inputBackground,
    },
    gridImage: {
      width: '100%',
      height: '100%',
    },
    gridFavoriteButton: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    gridBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    gridContent: {
      padding: 12,
    },
    gridPriceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    gridPrice: {
      fontSize: 16,
      fontWeight: '700',
    },
    gridComparePrice: {
      fontSize: 12,
      textDecorationLine: 'line-through',
      marginTop: 2,
    },
    gridAddToCartButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Common styles
    placeholderImage: {
      backgroundColor: colors.inputBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      position: 'absolute',
      top: 8,
      left: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    outOfStockBadge: {
      backgroundColor: colors.textTertiary,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
    productName: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    ratingText: {
      fontSize: 13,
      marginLeft: 4,
    },
    ratingTextSmall: {
      fontSize: 11,
      marginLeft: 3,
    },
    priceContainer: {
      flexDirection: viewMode === 'grid' ? 'column' : 'row',
      alignItems: viewMode === 'grid' ? 'flex-start' : 'center',
      marginTop: viewMode === 'list' ? 8 : 0,
    },
    price: {
      fontSize: 15,
      fontWeight: '700',
    },
    comparePrice: {
      fontSize: 13,
      textDecorationLine: 'line-through',
      marginLeft: viewMode === 'list' ? 8 : 0,
    },
    favoriteButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    addToCartButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export const ProductCard = memo(ProductCardComponent);
export default ProductCard;

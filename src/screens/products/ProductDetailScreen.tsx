/**
 * Product Detail Screen
 * Full product page with gallery, variants, reviews, and related products
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Share,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useProduct } from '../../hooks';
import { ProductVariant, VariantOption, ProductReview } from '../../types/product';
import { Button, Skeleton } from '../../components/common';
import { HomeStackParamList } from '../../navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH;

type ProductDetailRouteProp = RouteProp<HomeStackParamList, 'ProductDetail'>;
type ProductDetailNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ProductDetail'>;

export function ProductDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProductDetailNavigationProp>();
  const route = useRoute<ProductDetailRouteProp>();

  const { productId } = route.params;

  const { product, loading, fetchReviews, addToFavorites, removeFromFavorites, isFavorite } = useProduct(productId);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const imageListRef = useRef<FlatList>(null);

  // Get unique option types (e.g., Color, Size)
  const optionTypes = React.useMemo(() => {
    if (!product?.variants?.length) return [];

    const types = new Map<string, Set<string>>();
    product.variants.forEach((variant) => {
      variant.options.forEach((option) => {
        if (!types.has(option.name)) {
          types.set(option.name, new Set());
        }
        types.get(option.name)!.add(option.value);
      });
    });

    return Array.from(types.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [product?.variants]);

  // Selected options state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Find matching variant based on selected options
  React.useEffect(() => {
    if (!product?.variants?.length) return;

    const matchingVariant = product.variants.find((variant) =>
      variant.options.every((option) => selectedOptions[option.name] === option.value)
    );

    setSelectedVariant(matchingVariant || null);
  }, [selectedOptions, product?.variants]);

  // Initialize with default variant options
  React.useEffect(() => {
    if (product?.variants?.length) {
      const defaultVariant = product.variants.find((v) => v.isDefault) || product.variants[0];
      if (defaultVariant) {
        const initialOptions: Record<string, string> = {};
        defaultVariant.options.forEach((opt) => {
          initialOptions[opt.name] = opt.value;
        });
        setSelectedOptions(initialOptions);
      }
    }
  }, [product?.variants]);

  // Load reviews
  React.useEffect(() => {
    if (productId) {
      fetchReviews(productId).then((result) => {
        setReviews(result.items);
      });
    }
  }, [productId, fetchReviews]);

  /** Handle option selection */
  const handleOptionSelect = useCallback((optionName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
  }, []);

  /** Handle quantity change */
  const handleQuantityChange = useCallback((delta: number) => {
    setQuantity((prev) => {
      const newValue = prev + delta;
      const maxStock = selectedVariant?.stock ?? product?.stock ?? 99;
      return Math.max(1, Math.min(newValue, maxStock));
    });
  }, [selectedVariant, product]);

  /** Handle add to cart */
  const handleAddToCart = useCallback(() => {
    // TODO: Implement add to cart
    console.log('Add to cart:', {
      productId,
      variantId: selectedVariant?.id,
      quantity,
    });
  }, [productId, selectedVariant, quantity]);

  /** Handle buy now */
  const handleBuyNow = useCallback(() => {
    // TODO: Navigate to checkout with this product
    console.log('Buy now:', {
      productId,
      variantId: selectedVariant?.id,
      quantity,
    });
  }, [productId, selectedVariant, quantity]);

  /** Handle share */
  const handleShare = useCallback(async () => {
    if (!product) return;

    try {
      await Share.share({
        title: product.name,
        message: `Découvrez ${product.name} - ${product.price.formatted || product.price.amount + ' ' + product.price.currency}`,
        url: `https://example.com/products/${product.id}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [product]);

  /** Handle favorite toggle */
  const handleFavoriteToggle = useCallback(async () => {
    if (isFavorite) {
      await removeFromFavorites(productId);
    } else {
      await addToFavorites(productId);
    }
  }, [isFavorite, productId, addToFavorites, removeFromFavorites]);

  /** Render image item */
  const renderImageItem = useCallback(({ item, index }: { item: { url: string }; index: number }) => (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => {/* TODO: Open fullscreen gallery */}}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.galleryImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  ), []);

  /** Render review item */
  const renderReviewItem = (review: ProductReview) => (
    <View key={review.id} style={[styles.reviewItem, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          {review.userAvatar ? (
            <Image source={{ uri: review.userAvatar }} style={styles.reviewAvatar} />
          ) : (
            <View style={[styles.reviewAvatarPlaceholder, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.reviewAvatarText, { color: theme.colors.primary }]}>
                {review.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={[styles.reviewUserName, { color: theme.colors.text }]}>
              {review.userName}
            </Text>
            {review.isVerifiedPurchase && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={theme.colors.success} />
                <Text style={[styles.verifiedText, { color: theme.colors.success }]}>
                  Achat vérifié
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.reviewRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= review.rating ? 'star' : 'star-outline'}
              size={14}
              color="#FFC107"
            />
          ))}
        </View>
      </View>
      {review.title && (
        <Text style={[styles.reviewTitle, { color: theme.colors.text }]}>
          {review.title}
        </Text>
      )}
      <Text style={[styles.reviewContent, { color: theme.colors.textSecondary }]}>
        {review.content}
      </Text>
    </View>
  );

  // Animated header opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT - 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Skeleton width={SCREEN_WIDTH} height={IMAGE_HEIGHT} />
        <View style={{ padding: 16 }}>
          <Skeleton width="80%" height={24} borderRadius={4} />
          <Skeleton width="40%" height={20} borderRadius={4} style={{ marginTop: 12 }} />
          <Skeleton width="100%" height={60} borderRadius={8} style={{ marginTop: 20 }} />
          <Skeleton width="100%" height={100} borderRadius={8} style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textTertiary} />
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
          Produit non trouvé
        </Text>
        <Button variant="secondary" onPress={() => navigation.goBack()}>Retour</Button>
      </View>
    );
  }

  const currentPrice = selectedVariant?.price ?? product.price;
  const comparePrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const hasDiscount = comparePrice && comparePrice.amount > currentPrice.amount;
  const currentStock = selectedVariant?.stock ?? product.stock;
  const isOutOfStock = currentStock <= 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            paddingTop: insets.top,
            backgroundColor: theme.colors.background,
            opacity: headerOpacity,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {product.name}
        </Text>
      </Animated.View>

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
      >
        <View style={[styles.backButtonBg, { backgroundColor: theme.colors.card }]}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </View>
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={[styles.headerActions, { top: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.headerActionButton, { backgroundColor: theme.colors.card }]}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerActionButton, { backgroundColor: theme.colors.card, marginLeft: 12 }]}
          onPress={handleFavoriteToggle}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? theme.colors.error : theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          <FlatList
            ref={imageListRef}
            data={product.images}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => `${item.url}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
          />

          {/* Image indicators */}
          {product.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {product.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    {
                      backgroundColor:
                        index === currentImageIndex
                          ? theme.colors.primary
                          : theme.colors.textTertiary,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          {/* Title and price */}
          <Text style={[styles.productName, { color: theme.colors.text }]}>
            {product.name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.colors.primary }]}>
              {currentPrice.formatted || `${currentPrice.amount} ${currentPrice.currency}`}
            </Text>
            {hasDiscount && (
              <Text style={[styles.comparePrice, { color: theme.colors.textTertiary }]}>
                {comparePrice?.formatted || `${comparePrice?.amount} ${comparePrice?.currency}`}
              </Text>
            )}
          </View>

          {/* Rating */}
          {product.rating && product.rating.count > 0 && (
            <View style={styles.ratingRow}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= product.rating!.average ? 'star' : 'star-outline'}
                    size={16}
                    color="#FFC107"
                  />
                ))}
              </View>
              <Text style={[styles.ratingText, { color: theme.colors.textSecondary }]}>
                {product.rating.average.toFixed(1)} ({product.rating.count} avis)
              </Text>
            </View>
          )}

          {/* Stock status */}
          <View style={styles.stockRow}>
            <View
              style={[
                styles.stockBadge,
                { backgroundColor: isOutOfStock ? theme.colors.error + '15' : theme.colors.success + '15' },
              ]}
            >
              <Ionicons
                name={isOutOfStock ? 'close-circle' : 'checkmark-circle'}
                size={16}
                color={isOutOfStock ? theme.colors.error : theme.colors.success}
              />
              <Text
                style={[
                  styles.stockText,
                  { color: isOutOfStock ? theme.colors.error : theme.colors.success },
                ]}
              >
                {isOutOfStock ? 'Rupture de stock' : `${currentStock} en stock`}
              </Text>
            </View>
          </View>

          {/* Variant options */}
          {optionTypes.map((optionType) => (
            <View key={optionType.name} style={styles.optionSection}>
              <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                {optionType.name}: <Text style={styles.optionValue}>{selectedOptions[optionType.name]}</Text>
              </Text>
              <View style={styles.optionValues}>
                {optionType.values.map((value) => {
                  const isSelected = selectedOptions[optionType.name] === value;
                  const isColor = optionType.name.toLowerCase().includes('couleur') || optionType.name.toLowerCase().includes('color');

                  if (isColor) {
                    return (
                      <TouchableOpacity
                        key={value}
                        style={[
                          styles.colorOption,
                          isSelected && { borderColor: theme.colors.primary, borderWidth: 2 },
                        ]}
                        onPress={() => handleOptionSelect(optionType.name, value)}
                      >
                        <View style={[styles.colorSwatch, { backgroundColor: value.toLowerCase() }]} />
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.sizeOption,
                        {
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                          backgroundColor: isSelected ? theme.colors.primary + '10' : 'transparent',
                        },
                      ]}
                      onPress={() => handleOptionSelect(optionType.name, value)}
                    >
                      <Text
                        style={[
                          styles.sizeOptionText,
                          { color: isSelected ? theme.colors.primary : theme.colors.text },
                        ]}
                      >
                        {value}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Quantity selector */}
          <View style={styles.quantitySection}>
            <Text style={[styles.optionLabel, { color: theme.colors.text }]}>Quantité</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={[styles.quantityButton, { borderColor: theme.colors.border }]}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={20} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.quantityText, { color: theme.colors.text }]}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.quantityButton, { borderColor: theme.colors.border }]}
                onPress={() => handleQuantityChange(1)}
                disabled={quantity >= currentStock}
              >
                <Ionicons name="add" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Description</Text>
            <Text
              style={[styles.description, { color: theme.colors.textSecondary }]}
              numberOfLines={showFullDescription ? undefined : 4}
            >
              {product.description}
            </Text>
            {product.description.length > 200 && (
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text style={[styles.showMoreText, { color: theme.colors.primary }]}>
                  {showFullDescription ? 'Voir moins' : 'Voir plus'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Specifications */}
          {product.attributes && product.attributes.length > 0 && (
            <View style={styles.specsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Caractéristiques</Text>
              {product.attributes
                .filter((attr) => attr.isVisible !== false)
                .map((attr, index) => (
                  <View
                    key={index}
                    style={[styles.specRow, { borderBottomColor: theme.colors.border }]}
                  >
                    <Text style={[styles.specName, { color: theme.colors.textSecondary }]}>
                      {attr.name}
                    </Text>
                    <Text style={[styles.specValue, { color: theme.colors.text }]}>{attr.value}</Text>
                  </View>
                ))}
            </View>
          )}

          {/* Reviews */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Avis clients ({product.rating?.count || 0})
              </Text>
              {reviews.length > 0 && (
                <TouchableOpacity>
                  <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>Voir tout</Text>
                </TouchableOpacity>
              )}
            </View>

            {reviews.length > 0 ? (
              reviews.slice(0, 3).map(renderReviewItem)
            ) : (
              <Text style={[styles.noReviewsText, { color: theme.colors.textSecondary }]}>
                Aucun avis pour le moment
              </Text>
            )}
          </View>

          {/* Spacer for bottom buttons */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Button
          onPress={handleAddToCart}
          disabled={isOutOfStock}
          style={{ flex: 1 }}
          leftIcon={<Ionicons name="cart-outline" size={20} color="#FFFFFF" />}
        >Ajouter au panier</Button>
        <TouchableOpacity
          style={[
            styles.buyNowButton,
            {
              backgroundColor: isOutOfStock ? theme.colors.surfaceDisabled : theme.colors.text,
            },
          ]}
          onPress={handleBuyNow}
          disabled={isOutOfStock}
        >
          <Text style={styles.buyNowText}>Acheter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 60,
    paddingBottom: 12,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
  },
  backButtonBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerActions: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    zIndex: 20,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  galleryContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  infoContainer: {
    padding: 16,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
  },
  comparePrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    marginLeft: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  stars: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  stockRow: {
    marginTop: 12,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  optionSection: {
    marginTop: 20,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  optionValue: {
    fontWeight: '400',
  },
  optionValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    marginBottom: 10,
    padding: 3,
  },
  colorSwatch: {
    flex: 1,
    borderRadius: 15,
  },
  sizeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
  },
  sizeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quantitySection: {
    marginTop: 20,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  descriptionSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  specsSection: {
    marginTop: 24,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  specName: {
    fontSize: 14,
    flex: 1,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  reviewsSection: {
    marginTop: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noReviewsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  reviewAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  verifiedText: {
    fontSize: 11,
    marginLeft: 3,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  reviewContent: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  buyNowButton: {
    marginLeft: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;

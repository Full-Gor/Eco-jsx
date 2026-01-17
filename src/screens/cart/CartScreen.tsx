/**
 * Cart Screen
 * Displays cart items with quantity controls, swipe to delete, and checkout button
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../../theme';
import { useCart } from '../../contexts/CartContext';
import { CartItem } from '../../types/cart';
import { Button } from '../../components/common';

type CartNavigationProp = NativeStackNavigationProp<{
  Cart: undefined;
  Checkout: undefined;
  ProductDetail: { productId: string };
}>;

export function CartScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CartNavigationProp>();

  const {
    items,
    summary,
    isLoading,
    error,
    updateQuantity,
    removeItem,
    moveToWishlist,
    applyPromoCode,
    removePromoCode,
    cart,
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());

  /** Handle quantity change */
  const handleQuantityChange = useCallback(
    async (item: CartItem, delta: number) => {
      const newQuantity = item.quantity + delta;
      if (newQuantity < 1) {
        Alert.alert(
          'Supprimer l\'article',
          'Voulez-vous retirer cet article du panier ?',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Supprimer',
              style: 'destructive',
              onPress: () => removeItem(item.id),
            },
          ]
        );
        return;
      }

      if (newQuantity > item.availableStock) {
        Alert.alert('Stock insuffisant', `Maximum disponible: ${item.availableStock}`);
        return;
      }

      await updateQuantity(item.id, newQuantity);
    },
    [removeItem, updateQuantity]
  );

  /** Handle swipe delete */
  const handleDelete = useCallback(
    async (itemId: string) => {
      swipeableRefs.current.get(itemId)?.close();
      await removeItem(itemId);
    },
    [removeItem]
  );

  /** Handle move to wishlist */
  const handleMoveToWishlist = useCallback(
    async (itemId: string) => {
      swipeableRefs.current.get(itemId)?.close();
      await moveToWishlist(itemId);
    },
    [moveToWishlist]
  );

  /** Handle promo code */
  const handleApplyPromo = useCallback(async () => {
    if (!promoInput.trim()) return;

    setPromoLoading(true);
    setPromoError(null);

    const result = await applyPromoCode(promoInput.trim().toUpperCase());

    if (!result.isValid) {
      setPromoError(result.error || 'Code invalide');
    } else {
      setPromoInput('');
    }

    setPromoLoading(false);
  }, [promoInput, applyPromoCode]);

  /** Handle remove promo */
  const handleRemovePromo = useCallback(async () => {
    await removePromoCode();
    setPromoInput('');
    setPromoError(null);
  }, [removePromoCode]);

  /** Navigate to checkout */
  const handleCheckout = useCallback(() => {
    navigation.navigate('Checkout');
  }, [navigation]);

  /** Navigate to product */
  const handleProductPress = useCallback(
    (item: CartItem) => {
      navigation.navigate('ProductDetail', { productId: item.productId });
    },
    [navigation]
  );

  /** Render swipe actions */
  const renderRightActions = useCallback(
    (item: CartItem, progress: Animated.AnimatedInterpolation<number>) => {
      const translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [160, 0],
      });

      return (
        <Animated.View style={[styles.swipeActions, { transform: [{ translateX }] }]}>
          <TouchableOpacity
            style={[styles.swipeAction, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleMoveToWishlist(item.id)}
          >
            <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
            <Text style={styles.swipeActionText}>Favoris</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.swipeAction, { backgroundColor: theme.colors.error }]}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
            <Text style={styles.swipeActionText}>Supprimer</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [theme.colors, handleMoveToWishlist, handleDelete]
  );

  /** Render cart item */
  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => {
      const imageUrl = item.variant?.image?.url || item.product.thumbnail?.url || item.product.images[0]?.url;
      const isUnavailable = !item.isAvailable;

      return (
        <Swipeable
          ref={(ref) => { swipeableRefs.current.set(item.id, ref); }}
          renderRightActions={(progress) => renderRightActions(item, progress)}
          rightThreshold={40}
          overshootRight={false}
        >
          <TouchableOpacity
            style={[
              styles.itemContainer,
              { backgroundColor: theme.colors.card },
              isUnavailable && styles.itemUnavailable,
            ]}
            onPress={() => handleProductPress(item)}
            activeOpacity={0.7}
          >
            {/* Product Image */}
            <View style={styles.imageContainer}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.inputBackground }]}>
                  <Ionicons name="image-outline" size={24} color={theme.colors.textTertiary} />
                </View>
              )}
              {isUnavailable && (
                <View style={[styles.unavailableBadge, { backgroundColor: theme.colors.error }]}>
                  <Text style={styles.unavailableBadgeText}>Rupture</Text>
                </View>
              )}
            </View>

            {/* Product Info */}
            <View style={styles.infoContainer}>
              <Text
                style={[
                  styles.productName,
                  { color: isUnavailable ? theme.colors.textTertiary : theme.colors.text },
                ]}
                numberOfLines={2}
              >
                {item.product.name}
              </Text>

              {item.variant && (
                <Text style={[styles.variantText, { color: theme.colors.textSecondary }]}>
                  {item.variant.options.map((o) => o.value).join(' / ')}
                </Text>
              )}

              <View style={styles.priceRow}>
                <Text
                  style={[
                    styles.price,
                    { color: isUnavailable ? theme.colors.textTertiary : theme.colors.primary },
                  ]}
                >
                  {item.totalPrice.formatted}
                </Text>
                {item.quantity > 1 && (
                  <Text style={[styles.unitPrice, { color: theme.colors.textTertiary }]}>
                    ({item.price.formatted} / unité)
                  </Text>
                )}
              </View>

              {/* Quantity Controls */}
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={[styles.quantityButton, { borderColor: theme.colors.border }]}
                  onPress={() => handleQuantityChange(item, -1)}
                  disabled={isUnavailable}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={isUnavailable ? theme.colors.textDisabled : theme.colors.text}
                  />
                </TouchableOpacity>
                <Text
                  style={[
                    styles.quantityText,
                    { color: isUnavailable ? theme.colors.textDisabled : theme.colors.text },
                  ]}
                >
                  {item.quantity}
                </Text>
                <TouchableOpacity
                  style={[styles.quantityButton, { borderColor: theme.colors.border }]}
                  onPress={() => handleQuantityChange(item, 1)}
                  disabled={isUnavailable || item.quantity >= item.availableStock}
                >
                  <Ionicons
                    name="add"
                    size={18}
                    color={
                      isUnavailable || item.quantity >= item.availableStock
                        ? theme.colors.textDisabled
                        : theme.colors.text
                    }
                  />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      );
    },
    [theme.colors, renderRightActions, handleProductPress, handleQuantityChange]
  );

  /** Render empty cart */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color={theme.colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Votre panier est vide
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Parcourez notre catalogue et ajoutez des articles à votre panier
      </Text>
      <Button
        variant="primary"
        onPress={() => navigation.goBack()}
        style={{ marginTop: 24 }}
      >
        Continuer mes achats
      </Button>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 16, borderBottomColor: theme.colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Mon Panier ({items.length})
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {items.length === 0 ? (
        renderEmpty()
      ) : (
        <>
          {/* Error message */}
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: theme.colors.errorBackground }]}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            </View>
          )}

          {/* Cart Items */}
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />

          {/* Bottom Section */}
          <View
            style={[
              styles.bottomSection,
              { backgroundColor: theme.colors.card, paddingBottom: insets.bottom + 16 },
            ]}
          >
            {/* Promo Code */}
            <View style={styles.promoSection}>
              {cart?.promoCode ? (
                <View style={[styles.appliedPromo, { backgroundColor: theme.colors.successBackground }]}>
                  <View style={styles.appliedPromoInfo}>
                    <Ionicons name="pricetag" size={18} color={theme.colors.success} />
                    <Text style={[styles.appliedPromoCode, { color: theme.colors.success }]}>
                      {cart.promoCode.code}
                    </Text>
                    <Text style={[styles.appliedPromoDiscount, { color: theme.colors.success }]}>
                      {cart.promoCode.discount.formatted}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleRemovePromo}>
                    <Ionicons name="close-circle" size={24} color={theme.colors.success} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.promoInputContainer}>
                  <TextInput
                    style={[
                      styles.promoInput,
                      {
                        backgroundColor: theme.colors.inputBackground,
                        borderColor: promoError ? theme.colors.error : theme.colors.border,
                        color: theme.colors.text,
                      },
                    ]}
                    placeholder="Code promo"
                    placeholderTextColor={theme.colors.inputPlaceholder}
                    value={promoInput}
                    onChangeText={setPromoInput}
                    autoCapitalize="characters"
                    returnKeyType="done"
                    onSubmitEditing={handleApplyPromo}
                  />
                  <TouchableOpacity
                    style={[
                      styles.promoButton,
                      { backgroundColor: theme.colors.primary },
                      (!promoInput.trim() || promoLoading) && { opacity: 0.5 },
                    ]}
                    onPress={handleApplyPromo}
                    disabled={!promoInput.trim() || promoLoading}
                  >
                    {promoLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.promoButtonText}>Appliquer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              {promoError && (
                <Text style={[styles.promoErrorText, { color: theme.colors.error }]}>
                  {promoError}
                </Text>
              )}
            </View>

            {/* Summary */}
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                  Sous-total ({summary.totalQuantity} article{summary.totalQuantity > 1 ? 's' : ''})
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {summary.subtotal.formatted}
                </Text>
              </View>

              {summary.discount && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.success }]}>
                    Réduction
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                    {summary.discount.formatted}
                  </Text>
                </View>
              )}

              <View style={[styles.totalRow, { borderTopColor: theme.colors.border }]}>
                <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
                  {summary.total.formatted}
                </Text>
              </View>
            </View>

            {/* Checkout Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleCheckout}
              disabled={items.some((i) => !i.isAvailable)}
            >
              Passer commande
            </Button>

            {items.some((i) => !i.isAvailable) && (
              <Text style={[styles.unavailableWarning, { color: theme.colors.error }]}>
                Certains articles ne sont plus disponibles. Veuillez les retirer du panier.
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
  },
  itemUnavailable: {
    opacity: 0.7,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unavailableBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  variantText: {
    fontSize: 12,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  unitPrice: {
    fontSize: 12,
    marginLeft: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeAction: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  bottomSection: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  promoSection: {
    marginBottom: 16,
  },
  promoInputContainer: {
    flexDirection: 'row',
  },
  promoInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  promoButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  promoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  promoErrorText: {
    fontSize: 12,
    marginTop: 4,
  },
  appliedPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  appliedPromoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedPromoCode: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  appliedPromoDiscount: {
    fontSize: 14,
    marginLeft: 8,
  },
  summarySection: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  unavailableWarning: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default CartScreen;

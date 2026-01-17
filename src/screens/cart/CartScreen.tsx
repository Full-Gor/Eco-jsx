/**
 * Cart Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button, Card } from '../../components/common';

const PLACEHOLDER_ITEMS = [
  { id: '1', name: 'T-shirt Premium Coton', price: 29.99, quantity: 2, variant: 'Noir / M' },
  { id: '2', name: 'Jean Slim Fit', price: 59.99, quantity: 1, variant: 'Bleu / 32' },
  { id: '3', name: 'Sneakers Urban', price: 89.99, quantity: 1, variant: 'Blanc / 43' },
];

export function CartScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const subtotal = PLACEHOLDER_ITEMS.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = 4.99;
  const total = subtotal + shipping;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Mon panier
        </Text>
        <Text style={[styles.itemCount, { color: theme.colors.textSecondary }]}>
          {PLACEHOLDER_ITEMS.length} articles
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart items */}
        {PLACEHOLDER_ITEMS.map((item) => (
          <Card key={item.id} variant="outlined" padding="md" style={styles.cartItem}>
            <View style={styles.itemRow}>
              {/* Product image placeholder */}
              <View
                style={[
                  styles.itemImage,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <Ionicons name="image-outline" size={24} color={theme.colors.textTertiary} />
              </View>

              <View style={styles.itemInfo}>
                <Text
                  style={[styles.itemName, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text style={[styles.itemVariant, { color: theme.colors.textSecondary }]}>
                  {item.variant}
                </Text>
                <Text style={[styles.itemPrice, { color: theme.colors.primary }]}>
                  {item.price.toFixed(2)} €
                </Text>
              </View>

              {/* Quantity controls */}
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Ionicons name="remove" size={16} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.quantity, { color: theme.colors.text }]}>
                  {item.quantity}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.quantityButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Ionicons name="add" size={16} color={theme.colors.textInverse} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))}

        {/* Promo code */}
        <Card variant="outlined" padding="md" style={styles.promoSection}>
          <View style={styles.promoRow}>
            <Ionicons name="pricetag-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.promoText, { color: theme.colors.textSecondary }]}>
              Ajouter un code promo
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
          </View>
        </Card>

        {/* Order summary */}
        <Card variant="filled" padding="lg" style={styles.summary}>
          <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
            Résumé de la commande
          </Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Sous-total
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {subtotal.toFixed(2)} €
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Livraison
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {shipping.toFixed(2)} €
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.border, marginVertical: 12 },
            ]}
          />

          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
              {total.toFixed(2)} €
            </Text>
          </View>
        </Card>

        <View style={{ height: theme.spacing['5xl'] }} />
      </ScrollView>

      {/* Checkout button */}
      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: insets.bottom + theme.spacing.lg,
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Button size="lg" fullWidth>
          Passer la commande
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  itemCount: {
    fontSize: 14,
  },
  content: {
    paddingTop: 16,
  },
  cartItem: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 13,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 24,
    textAlign: 'center',
  },
  promoSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promoText: {
    flex: 1,
    fontSize: 14,
  },
  summary: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  divider: {
    height: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default CartScreen;

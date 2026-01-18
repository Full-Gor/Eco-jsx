/**
 * Favorites Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Card } from '../../components/common';

const PLACEHOLDER_FAVORITES = [
  { id: '1', name: 'Montre Connectée Pro', price: 199.99, originalPrice: 249.99 },
  { id: '2', name: 'Casque Audio Sans Fil', price: 79.99, originalPrice: null },
  { id: '3', name: 'Veste Cuir Premium', price: 299.99, originalPrice: 399.99 },
  { id: '4', name: 'Sneakers Limited Edition', price: 149.99, originalPrice: null },
];

export function FavoritesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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
          Mes favoris
        </Text>
        <Text style={[styles.itemCount, { color: theme.colors.textSecondary }]}>
          {PLACEHOLDER_FAVORITES.length} articles
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Favorites grid */}
        <View style={styles.grid}>
          {PLACEHOLDER_FAVORITES.map((item) => (
            <Card key={item.id} style={styles.favoriteCard} pressable>
              {/* Product image placeholder */}
              <View
                style={[
                  styles.productImage,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <Ionicons name="image-outline" size={32} color={theme.colors.textTertiary} />

                {/* Remove from favorites button */}
                <TouchableOpacity
                  style={[
                    styles.removeButton,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Ionicons name="heart" size={18} color={theme.colors.error} />
                </TouchableOpacity>

                {/* Sale badge */}
                {item.originalPrice && (
                  <View
                    style={[
                      styles.saleBadge,
                      { backgroundColor: theme.colors.error },
                    ]}
                  >
                    <Text style={styles.saleBadgeText}>
                      -{Math.round((1 - item.price / item.originalPrice) * 100)}%
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.productInfo}>
                <Text
                  style={[styles.productName, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                    {item.price.toFixed(2)} €
                  </Text>
                  {item.originalPrice && (
                    <Text
                      style={[
                        styles.originalPrice,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      {item.originalPrice.toFixed(2)} €
                    </Text>
                  )}
                </View>

                {/* Add to cart button */}
                <TouchableOpacity
                  style={[
                    styles.addToCartButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Ionicons name="cart-outline" size={18} color={theme.colors.textInverse} />
                  <Text style={[styles.addToCartText, { color: theme.colors.textInverse }]}>
                    Ajouter
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>

        {/* Empty state info */}
        <Card variant="outlined" padding="lg" style={styles.infoCard}>
          <Ionicons name="heart-outline" size={24} color={theme.colors.textSecondary} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Ajoutez des produits à vos favoris pour les retrouver facilement
          </Text>
        </Card>

        <View style={{ height: theme.spacing['5xl'] }} />
      </ScrollView>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  favoriteCard: {
    width: '48%',
    flexGrow: 1,
  },
  productImage: {
    height: 140,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saleBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  productInfo: {
    paddingHorizontal: 4,
  },
  productName: {
    fontSize: 14,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  originalPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 4,
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default FavoritesScreen;

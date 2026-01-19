/**
 * Home Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeContext } from '../../theme';
import { Card, ThemeToggle } from '../../components/common';

export function HomeScreen() {
  const theme = useTheme();
  const { toggleTheme, themeMode } = useThemeContext();
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
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
            Bonjour 👋
          </Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Découvrez nos produits
          </Text>
        </View>
        <View style={styles.headerActions}>
          <ThemeToggle
            isDark={theme.isDark}
            onToggle={toggleTheme}
            size="sm"
          />
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: theme.spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search bar placeholder */}
        <TouchableOpacity
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.inputBackground,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.colors.textTertiary} />
          <Text style={[styles.searchPlaceholder, { color: theme.colors.textTertiary }]}>
            Rechercher un produit...
          </Text>
        </TouchableOpacity>

        {/* Banner placeholder */}
        <Card variant="filled" padding="lg" style={styles.banner}>
          <Text style={[styles.bannerTitle, { color: theme.colors.text }]}>
            🎉 Soldes d'hiver
          </Text>
          <Text style={[styles.bannerSubtitle, { color: theme.colors.textSecondary }]}>
            Jusqu'à -50% sur une sélection d'articles
          </Text>
        </Card>

        {/* Categories section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Catégories
            </Text>
            <TouchableOpacity>
              <Text style={{ color: theme.colors.primary }}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Mode', 'Électronique', 'Maison', 'Sport', 'Beauté'].map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryItem,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: theme.colors.primary + '20' },
                  ]}
                >
                  <Ionicons name="grid-outline" size={24} color={theme.colors.primary} />
                </View>
                <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured products placeholder */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Produits populaires
            </Text>
            <TouchableOpacity>
              <Text style={{ color: theme.colors.primary }}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productsGrid}>
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} style={styles.productCard} pressable>
                <View
                  style={[
                    styles.productImage,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Ionicons name="image-outline" size={32} color={theme.colors.textTertiary} />
                </View>
                <View style={styles.productInfo}>
                  <Text
                    style={[styles.productName, { color: theme.colors.text }]}
                    numberOfLines={2}
                  >
                    Produit exemple {item}
                  </Text>
                  <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                    29,99 €
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Placeholder info */}
        <Card variant="outlined" padding="lg" style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.info} />
          <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
            Ceci est un écran placeholder. Les données seront chargées dynamiquement
            dans les phases suivantes.
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
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchPlaceholder: {
    marginLeft: 8,
    fontSize: 16,
  },
  banner: {
    marginBottom: 24,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
  },
  section: {
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
    fontWeight: '600',
  },
  categoryItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 80,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productCard: {
    width: '48%',
    flexGrow: 1,
  },
  productImage: {
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  productInfo: {
    paddingHorizontal: 4,
  },
  productName: {
    fontSize: 14,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default HomeScreen;

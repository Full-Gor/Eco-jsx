/**
 * Categories Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Card } from '../../components/common';

const PLACEHOLDER_CATEGORIES = [
  { id: '1', name: 'Mode Femme', icon: 'woman-outline', count: 125 },
  { id: '2', name: 'Mode Homme', icon: 'man-outline', count: 98 },
  { id: '3', name: 'Électronique', icon: 'phone-portrait-outline', count: 256 },
  { id: '4', name: 'Maison & Déco', icon: 'home-outline', count: 180 },
  { id: '5', name: 'Sport & Loisirs', icon: 'fitness-outline', count: 142 },
  { id: '6', name: 'Beauté & Santé', icon: 'heart-outline', count: 89 },
  { id: '7', name: 'Enfants', icon: 'happy-outline', count: 76 },
  { id: '8', name: 'Alimentation', icon: 'restaurant-outline', count: 54 },
  { id: '9', name: 'Auto & Moto', icon: 'car-outline', count: 67 },
  { id: '10', name: 'Jardin', icon: 'leaf-outline', count: 43 },
];

export function CategoriesScreen() {
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
          Catégories
        </Text>
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
            Rechercher une catégorie...
          </Text>
        </TouchableOpacity>

        {/* Categories list */}
        {PLACEHOLDER_CATEGORIES.map((category) => (
          <Card
            key={category.id}
            variant="outlined"
            padding="md"
            style={styles.categoryCard}
            pressable
          >
            <View style={styles.categoryRow}>
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: theme.colors.primary + '15' },
                ]}
              >
                <Ionicons
                  name={category.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                  {category.name}
                </Text>
                <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                  {category.count} produits
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </View>
          </Card>
        ))}

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
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    paddingTop: 16,
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
  categoryCard: {
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 13,
  },
});

export default CategoriesScreen;

/**
 * Categories Screen
 * Displays category tree with navigation
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useCategories } from '../../hooks';
import { Category } from '../../types/product';
import { Card, Skeleton } from '../../components/common';
import { HomeStackParamList } from '../../navigation/types';

const PLACEHOLDER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'mode-femme': 'woman-outline',
  'mode-homme': 'man-outline',
  'electronique': 'phone-portrait-outline',
  'maison': 'home-outline',
  'sport': 'fitness-outline',
  'beaute': 'heart-outline',
  'enfants': 'happy-outline',
  'alimentation': 'restaurant-outline',
  'auto': 'car-outline',
  'jardin': 'leaf-outline',
  'default': 'grid-outline',
};

// Fallback categories for when no data is loaded
const FALLBACK_CATEGORIES = [
  { id: '1', name: 'Mode Femme', slug: 'mode-femme', productCount: 125, isActive: true },
  { id: '2', name: 'Mode Homme', slug: 'mode-homme', productCount: 98, isActive: true },
  { id: '3', name: 'Électronique', slug: 'electronique', productCount: 256, isActive: true },
  { id: '4', name: 'Maison & Déco', slug: 'maison', productCount: 180, isActive: true },
  { id: '5', name: 'Sport & Loisirs', slug: 'sport', productCount: 142, isActive: true },
  { id: '6', name: 'Beauté & Santé', slug: 'beaute', productCount: 89, isActive: true },
  { id: '7', name: 'Enfants', slug: 'enfants', productCount: 76, isActive: true },
  { id: '8', name: 'Alimentation', slug: 'alimentation', productCount: 54, isActive: true },
  { id: '9', name: 'Auto & Moto', slug: 'auto', productCount: 67, isActive: true },
  { id: '10', name: 'Jardin', slug: 'jardin', productCount: 43, isActive: true },
];

type CategoriesNavigationProp = NativeStackNavigationProp<HomeStackParamList>;

export function CategoriesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CategoriesNavigationProp>();

  const { categories, fetchCategories } = useCategories();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Use fallback if no categories loaded
  const displayCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES as unknown as Category[];

  /** Toggle category expansion */
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  /** Navigate to category products */
  const handleCategoryPress = useCallback((category: Category) => {
    navigation.navigate('ProductList', {
      categoryId: category.id,
      categoryName: category.name,
    });
  }, [navigation]);

  /** Navigate to search */
  const handleSearchPress = useCallback(() => {
    navigation.navigate('Search' as never);
  }, [navigation]);

  /** Handle refresh */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  }, [fetchCategories]);

  /** Get icon for category */
  const getCategoryIcon = (slug: string): keyof typeof Ionicons.glyphMap => {
    const normalizedSlug = slug.toLowerCase().replace(/[-_\s]/g, '');
    for (const [key, icon] of Object.entries(PLACEHOLDER_ICONS)) {
      if (normalizedSlug.includes(key.replace('-', ''))) {
        return icon;
      }
    }
    return PLACEHOLDER_ICONS.default;
  };

  /** Render category item */
  const renderCategoryItem = (category: Category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <View key={category.id}>
        <Card
          variant="outlined"
          padding="md"
          style={{ ...styles.categoryCard, marginLeft: level * 16 }}
          pressable
          onPress={() => hasChildren ? toggleCategory(category.id) : handleCategoryPress(category)}
        >
          <View style={styles.categoryRow}>
            {/* Category image or icon */}
            {category.image?.url ? (
              <Image
                source={{ uri: category.image.url }}
                style={[styles.categoryImage, { backgroundColor: theme.colors.inputBackground }]}
              />
            ) : (
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: theme.colors.primary + '15' },
                ]}
              >
                <Ionicons
                  name={getCategoryIcon(category.slug)}
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
            )}

            {/* Category info */}
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                {category.name}
              </Text>
              {category.productCount !== undefined && (
                <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                  {category.productCount} produit{category.productCount !== 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {/* Expand/Navigate icon */}
            {hasChildren ? (
              <Ionicons
                name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                size={20}
                color={theme.colors.textTertiary}
              />
            ) : (
              <TouchableOpacity
                onPress={() => handleCategoryPress(category)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {/* Subcategories */}
        {hasChildren && isExpanded && (
          <View style={styles.subcategories}>
            {category.children!.map((child) => renderCategoryItem(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Search bar */}
        <TouchableOpacity
          style={[
            styles.searchBar,
            {
              backgroundColor: theme.colors.inputBackground,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={handleSearchPress}
        >
          <Ionicons name="search" size={20} color={theme.colors.textTertiary} />
          <Text style={[styles.searchPlaceholder, { color: theme.colors.textTertiary }]}>
            Rechercher une catégorie...
          </Text>
        </TouchableOpacity>

        {/* Categories list */}
        {displayCategories.map((category) => renderCategoryItem(category))}

        {/* All products button */}
        <TouchableOpacity
          style={[styles.allProductsButton, { backgroundColor: theme.colors.primary + '10' }]}
          onPress={() => navigation.navigate('ProductList', {})}
        >
          <Text style={[styles.allProductsText, { color: theme.colors.primary }]}>
            Voir tous les produits
          </Text>
          <Ionicons name="arrow-forward" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

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
  categoryImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
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
  subcategories: {
    marginTop: 4,
  },
  allProductsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  allProductsText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default CategoriesScreen;

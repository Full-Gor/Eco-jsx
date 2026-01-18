/**
 * Shop Screen
 * Seller's shop page viewed by buyers
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSeller } from '../../contexts/SellerContext';
import type { Seller, SellerReview } from '../../types/marketplace';
import type { Product } from '../../types/product';

interface ShopScreenProps {
  route: {
    params: {
      sellerId?: string;
      slug?: string;
    };
  };
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    goBack: () => void;
  };
}

type TabType = 'products' | 'about' | 'reviews';

/**
 * Shop Screen Component
 */
export function ShopScreen({ route, navigation }: ShopScreenProps) {
  const { sellerId, slug } = route.params;
  const {
    currentSeller,
    isLoading,
    loadSeller,
    loadSellerBySlug,
    getSellerProducts,
    getSellerReviews,
    followSeller,
    unfollowSeller,
    isFollowing: checkIsFollowing,
  } = useSeller();

  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [isFollowingState, setIsFollowingState] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Load seller
  useEffect(() => {
    const loadData = async () => {
      let seller: Seller | null = null;
      if (sellerId) {
        seller = await loadSeller(sellerId);
      } else if (slug) {
        seller = await loadSellerBySlug(slug);
      }

      if (seller) {
        const following = await checkIsFollowing(seller.id);
        setIsFollowingState(following);
        loadProducts(seller.id);
      }
    };

    loadData();
  }, [sellerId, slug]);

  const loadProducts = useCallback(
    async (id: string, page = 1) => {
      setLoadingProducts(true);
      const prods = await getSellerProducts(id, page);
      setProducts((prev) => (page === 1 ? prods : [...prev, ...prods]));
      setLoadingProducts(false);
    },
    [getSellerProducts]
  );

  const loadReviews = useCallback(
    async (id: string, page = 1) => {
      setLoadingReviews(true);
      const revs = await getSellerReviews(id, page);
      setReviews((prev) => (page === 1 ? revs : [...prev, ...revs]));
      setLoadingReviews(false);
    },
    [getSellerReviews]
  );

  // Load reviews when tab changes
  useEffect(() => {
    if (activeTab === 'reviews' && currentSeller && reviews.length === 0) {
      loadReviews(currentSeller.id);
    }
  }, [activeTab, currentSeller]);

  const handleFollow = useCallback(async () => {
    if (!currentSeller) return;

    if (isFollowingState) {
      const success = await unfollowSeller(currentSeller.id);
      if (success) setIsFollowingState(false);
    } else {
      const success = await followSeller(currentSeller.id);
      if (success) setIsFollowingState(true);
    }
  }, [currentSeller, isFollowingState, followSeller, unfollowSeller]);

  const handleContact = useCallback(() => {
    if (!currentSeller) return;
    navigation.navigate('Chat', { sellerId: currentSeller.id });
  }, [currentSeller, navigation]);

  const handleProductPress = useCallback(
    (product: Product) => {
      navigation.navigate('Product', { productId: product.id });
    },
    [navigation]
  );

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= rating ? '★' : '☆'}
        </Text>
      );
    }
    return stars;
  };

  const renderBadge = (badge: Seller['badges'][0]) => (
    <View key={badge.type} style={styles.badge}>
      <Text style={styles.badgeText}>{badge.type.replace('_', ' ')}</Text>
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      <Image
        source={{ uri: item.images?.[0]?.url || item.thumbnail?.url || '' }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>${item.price.amount.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderReview = ({ item }: { item: SellerReview }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewerName}>{item.buyerName}</Text>
        <View style={styles.reviewRating}>{renderStars(item.rating)}</View>
      </View>
      {item.title && <Text style={styles.reviewTitle}>{item.title}</Text>}
      <Text style={styles.reviewComment}>{item.comment}</Text>
      <Text style={styles.reviewDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      {item.sellerResponse && (
        <View style={styles.sellerResponse}>
          <Text style={styles.sellerResponseLabel}>Seller Response:</Text>
          <Text style={styles.sellerResponseText}>
            {item.sellerResponse.content}
          </Text>
        </View>
      )}
    </View>
  );

  if (isLoading || !currentSeller) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Banner & Header */}
      <View style={styles.header}>
        {currentSeller.banner && (
          <Image
            source={{ uri: currentSeller.banner }}
            style={styles.banner}
            resizeMode="cover"
          />
        )}
        <View style={styles.shopInfo}>
          {currentSeller.logo && (
            <Image source={{ uri: currentSeller.logo }} style={styles.logo} />
          )}
          <View style={styles.shopDetails}>
            <Text style={styles.shopName}>{currentSeller.shopName}</Text>
            <View style={styles.ratingRow}>
              {renderStars(currentSeller.rating)}
              <Text style={styles.ratingText}>
                {currentSeller.rating.toFixed(1)} ({currentSeller.reviewCount} reviews)
              </Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        {currentSeller.badges.length > 0 && (
          <View style={styles.badgesContainer}>
            {currentSeller.badges.map(renderBadge)}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentSeller.productCount}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentSeller.salesCount}</Text>
            <Text style={styles.statLabel}>Sales</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.floor(
                (Date.now() - new Date(currentSeller.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24 * 30)
              )}
              m
            </Text>
            <Text style={styles.statLabel}>Selling</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.followButton, isFollowingState && styles.followingButton]}
            onPress={handleFollow}
          >
            <Text
              style={[
                styles.followButtonText,
                isFollowingState && styles.followingButtonText,
              ]}
            >
              {isFollowingState ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
            <Text style={styles.contactButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'products' && styles.tabTextActive,
            ]}
          >
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'about' && styles.tabActive]}
          onPress={() => setActiveTab('about')}
        >
          <Text
            style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}
          >
            About
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'reviews' && styles.tabTextActive,
            ]}
          >
            Reviews
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'products' && (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          ListEmptyComponent={
            loadingProducts ? (
              <ActivityIndicator style={styles.contentLoader} />
            ) : (
              <Text style={styles.emptyText}>No products yet</Text>
            )
          }
        />
      )}

      {activeTab === 'about' && (
        <ScrollView style={styles.aboutContainer}>
          {currentSeller.description && (
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>About</Text>
              <Text style={styles.aboutText}>{currentSeller.description}</Text>
            </View>
          )}

          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>Policies</Text>
            <View style={styles.policyItem}>
              <Text style={styles.policyLabel}>Return Policy</Text>
              <Text style={styles.policyText}>
                {currentSeller.policies.returnPolicy}
              </Text>
            </View>
            <View style={styles.policyItem}>
              <Text style={styles.policyLabel}>Shipping Policy</Text>
              <Text style={styles.policyText}>
                {currentSeller.policies.shippingPolicy}
              </Text>
            </View>
            <View style={styles.policyItem}>
              <Text style={styles.policyLabel}>Response Time</Text>
              <Text style={styles.policyText}>
                {currentSeller.policies.responseTime}
              </Text>
            </View>
          </View>

          {currentSeller.socialLinks && (
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>Social Links</Text>
              {/* Social links would go here */}
            </View>
          )}
        </ScrollView>
      )}

      {activeTab === 'reviews' && (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.reviewsList}
          ListEmptyComponent={
            loadingReviews ? (
              <ActivityIndicator style={styles.contentLoader} />
            ) : (
              <Text style={styles.emptyText}>No reviews yet</Text>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 16,
  },
  banner: {
    width: '100%',
    height: 120,
  },
  shopInfo: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#fff',
    marginTop: -32,
    backgroundColor: '#e0e0e0',
  },
  shopDetails: {
    marginLeft: 12,
    flex: 1,
  },
  shopName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  star: {
    fontSize: 14,
    color: '#FFC107',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    color: '#1976D2',
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 12,
    marginHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  followButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#2196F3',
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  productsGrid: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: '47%',
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  contentLoader: {
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 40,
  },
  aboutContainer: {
    flex: 1,
    padding: 16,
  },
  aboutSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  policyItem: {
    marginBottom: 12,
  },
  policyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  policyText: {
    fontSize: 13,
    color: '#666',
  },
  reviewsList: {
    padding: 16,
  },
  reviewItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
  },
  sellerResponse: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    marginTop: 12,
  },
  sellerResponseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sellerResponseText: {
    fontSize: 13,
    color: '#666',
  },
});

/**
 * Image Search Screen
 * Visual product search with camera/gallery
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useImageSearch } from '../../contexts/ImageSearchContext';
import type { ImageSearchResult } from '../../types/advanced';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 48) / COLUMN_COUNT;

interface ImageSearchScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    goBack: () => void;
  };
  onPickImage?: () => Promise<string | null>; // Returns base64 image
  onTakePhoto?: () => Promise<string | null>; // Returns base64 image
}

/**
 * Image Search Screen Component
 */
export function ImageSearchScreen({
  navigation,
  onPickImage,
  onTakePhoto,
}: ImageSearchScreenProps) {
  const { isSearching, results, error, searchByImage, clearResults, isReady } = useImageSearch();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handlePickImage = useCallback(async () => {
    if (!onPickImage) {
      Alert.alert('Not Available', 'Image picker is not configured');
      return;
    }

    try {
      const image = await onPickImage();
      if (image) {
        setSelectedImage(image);
        await searchByImage(image);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  }, [onPickImage, searchByImage]);

  const handleTakePhoto = useCallback(async () => {
    if (!onTakePhoto) {
      Alert.alert('Not Available', 'Camera is not configured');
      return;
    }

    try {
      const image = await onTakePhoto();
      if (image) {
        setSelectedImage(image);
        await searchByImage(image);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo');
    }
  }, [onTakePhoto, searchByImage]);

  const handleProductPress = useCallback(
    (result: ImageSearchResult) => {
      navigation.navigate('ProductDetail', { productId: result.productId });
    },
    [navigation]
  );

  const handleClear = useCallback(() => {
    setSelectedImage(null);
    clearResults();
  }, [clearResults]);

  const renderResult = useCallback(
    ({ item }: { item: ImageSearchResult }) => (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.product.images?.[0]?.url || item.product.thumbnail?.url || '' }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product.name}
          </Text>
          <Text style={styles.productPrice}>
            ${item.product.price.amount.toFixed(2)}
          </Text>
          <View style={styles.similarityBadge}>
            <Text style={styles.similarityText}>
              {Math.round(item.similarity * 100)}% match
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleProductPress]
  );

  if (!isReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading image search...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: selectedImage }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action Buttons */}
      {!selectedImage && (
        <View style={styles.actionsContainer}>
          <Text style={styles.title}>Search by Image</Text>
          <Text style={styles.subtitle}>
            Take a photo or choose from gallery to find similar products
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cameraButton]}
              onPress={handleTakePhoto}
            >
              <Text style={styles.buttonIcon}>📷</Text>
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.galleryButton]}
              onPress={handlePickImage}
            >
              <Text style={styles.buttonIcon}>🖼️</Text>
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Loading State */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Searching for similar products...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleClear}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {!isSearching && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            {results.length} similar product{results.length !== 1 ? 's' : ''} found
          </Text>
          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item) => item.productId}
            numColumns={COLUMN_COUNT}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* No Results */}
      {!isSearching && selectedImage && results.length === 0 && !error && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsIcon}>🔍</Text>
          <Text style={styles.noResultsText}>No similar products found</Text>
          <Text style={styles.noResultsHint}>
            Try with a different image or angle
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  previewContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  previewImage: {
    width: width - 32,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#e9ecef',
  },
  clearButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#6c757d',
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    width: 140,
    height: 140,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraButton: {
    backgroundColor: '#007AFF',
  },
  galleryButton: {
    backgroundColor: '#34C759',
  },
  buttonIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  resultsList: {
    paddingBottom: 16,
  },
  resultItem: {
    width: ITEM_WIDTH,
    marginRight: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: ITEM_WIDTH,
    backgroundColor: '#e9ecef',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  similarityBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  similarityText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noResultsIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  noResultsHint: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
});

/**
 * Search Screen
 * Full-text search with suggestions, filters, and history
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import { useSearch } from '../../hooks';
import { Product } from '../../types/product';
import { ProductCard } from '../../components/product/ProductCard';
import { HomeStackParamList } from '../../navigation/types';

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;

type SearchNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Search'>;

export function SearchScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SearchNavigationProp>();

  const { results, query, suggestions, loading, search, getSuggestions, clearSearch } = useSearch();

  const [inputValue, setInputValue] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(true);

  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load search history
  useEffect(() => {
    loadSearchHistory();
    inputRef.current?.focus();
  }, []);

  /** Load search history from storage */
  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  /** Save search history */
  const saveSearchHistory = async (newHistory: string[]) => {
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      setSearchHistory(newHistory);
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  /** Add to search history */
  const addToHistory = useCallback((term: string) => {
    if (!term.trim()) return;

    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== term.toLowerCase());
      const newHistory = [term, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveSearchHistory(newHistory);
      return newHistory;
    });
  }, []);

  /** Remove from history */
  const removeFromHistory = useCallback((term: string) => {
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item !== term);
      saveSearchHistory(filtered);
      return filtered;
    });
  }, []);

  /** Clear all history */
  const clearHistory = useCallback(() => {
    saveSearchHistory([]);
  }, []);

  /** Handle input change with debounced suggestions */
  const handleInputChange = useCallback((text: string) => {
    setInputValue(text);
    setShowSuggestions(true);

    // Debounce suggestions
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.length >= 2) {
      debounceRef.current = setTimeout(() => {
        getSuggestions(text);
      }, 300);
    }
  }, [getSuggestions]);

  /** Handle search submit */
  const handleSearch = useCallback((searchTerm?: string) => {
    const term = searchTerm || inputValue;
    if (!term.trim()) return;

    Keyboard.dismiss();
    setShowSuggestions(false);
    addToHistory(term);
    search(term);
  }, [inputValue, search, addToHistory]);

  /** Handle suggestion/history item press */
  const handleItemPress = useCallback((term: string) => {
    setInputValue(term);
    handleSearch(term);
  }, [handleSearch]);

  /** Handle product press */
  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  }, [navigation]);

  /** Handle clear search */
  const handleClear = useCallback(() => {
    setInputValue('');
    clearSearch();
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [clearSearch]);

  /** Render search result item */
  const renderResultItem = useCallback(({ item }: { item: Product }) => (
    <View style={styles.resultItem}>
      <ProductCard
        product={item}
        viewMode="list"
        onPress={handleProductPress}
      />
    </View>
  ), [handleProductPress]);

  /** Render suggestion/history item */
  const renderSuggestionItem = ({ item, type }: { item: string; type: 'suggestion' | 'history' }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.suggestionIcon}>
        <Ionicons
          name={type === 'history' ? 'time-outline' : 'search-outline'}
          size={18}
          color={theme.colors.textSecondary}
        />
      </View>
      <Text style={[styles.suggestionText, { color: theme.colors.text }]} numberOfLines={1}>
        {item}
      </Text>
      {type === 'history' && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromHistory(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      )}
      <Ionicons name="arrow-up-outline" size={18} color={theme.colors.textTertiary} style={styles.arrowIcon} />
    </TouchableOpacity>
  );

  /** Render empty state */
  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={64} color={theme.colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          Aucun résultat
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
          Essayez avec d'autres mots-clés
        </Text>
      </View>
    );
  };

  const showHistory = isFocused && showSuggestions && !query && searchHistory.length > 0;
  const showSuggestionsList = isFocused && showSuggestions && inputValue.length >= 2 && suggestions.length > 0;
  const showResults = query && results.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        {/* Search input */}
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: theme.colors.inputBackground,
              borderColor: isFocused ? theme.colors.primary : theme.colors.border,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={theme.colors.textTertiary} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Rechercher un produit..."
            placeholderTextColor={theme.colors.textTertiary}
            value={inputValue}
            onChangeText={handleInputChange}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {inputValue.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search History */}
      {showHistory && (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: theme.colors.text }]}>
              Recherches récentes
            </Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={[styles.clearHistoryText, { color: theme.colors.primary }]}>
                Effacer
              </Text>
            </TouchableOpacity>
          </View>
          {searchHistory.map((item) => (
            <View key={item}>
              {renderSuggestionItem({ item, type: 'history' })}
            </View>
          ))}
        </View>
      )}

      {/* Suggestions */}
      {showSuggestionsList && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item) => (
            <View key={item}>
              {renderSuggestionItem({ item, type: 'suggestion' })}
            </View>
          ))}
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {/* Search Results */}
      {showResults ? (
        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={[styles.resultsCount, { color: theme.colors.textSecondary }]}>
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </Text>
          }
        />
      ) : query && !loading ? (
        renderEmpty()
      ) : null}

      {/* Popular searches (when no input and no history) */}
      {!showHistory && !showSuggestionsList && !query && !loading && searchHistory.length === 0 && (
        <View style={styles.popularContainer}>
          <Text style={[styles.popularTitle, { color: theme.colors.text }]}>
            Recherches populaires
          </Text>
          <View style={styles.popularTags}>
            {['Mode', 'Électronique', 'Maison', 'Sport', 'Beauté'].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.popularTag, { backgroundColor: theme.colors.inputBackground }]}
                onPress={() => handleItemPress(tag)}
              >
                <Text style={[styles.popularTagText, { color: theme.colors.text }]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    marginRight: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  historyContainer: {
    paddingTop: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearHistoryText: {
    fontSize: 14,
  },
  suggestionsContainer: {
    paddingTop: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionIcon: {
    width: 32,
    alignItems: 'center',
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
  },
  removeButton: {
    padding: 4,
  },
  arrowIcon: {
    marginLeft: 12,
    transform: [{ rotate: '-45deg' }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContent: {
    padding: 16,
    paddingBottom: 100,
  },
  resultsCount: {
    fontSize: 13,
    marginBottom: 12,
  },
  resultItem: {
    marginBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  popularContainer: {
    padding: 16,
  },
  popularTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  popularTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  popularTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  popularTagText: {
    fontSize: 14,
  },
});

export default SearchScreen;

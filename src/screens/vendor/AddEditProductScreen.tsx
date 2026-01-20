/**
 * Add/Edit Product Screen
 * Form for creating and editing products
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme';
import { useVendorProducts, useVendorCategories, useImageUpload } from '../../contexts/VendorContext';
import { ProductCreateData, VendorCategory, VendorProductStatus } from '../../types/vendor';

interface AddEditProductScreenProps {
  navigation: {
    goBack: () => void;
    setOptions: (options: { title: string }) => void;
  };
  route: {
    params?: {
      productId?: string;
    };
  };
}

export function AddEditProductScreen({ navigation, route }: AddEditProductScreenProps) {
  const theme = useTheme();
  const productId = route.params?.productId;
  const isEditing = !!productId;

  const { getProduct, addProduct, updateProduct } = useVendorProducts();
  const { categories, getCategories } = useVendorCategories();
  const { uploadImage } = useImageUpload();

  const [formData, setFormData] = useState<ProductCreateData>({
    name: '',
    description: '',
    price: 0,
    compareAtPrice: undefined,
    images: [],
    categoryId: '',
    stock: 0,
    sku: '',
    status: 'active',
    tags: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    setIsLoading(true);
    await getCategories();

    if (productId) {
      const product = await getProduct(productId);
      if (product) {
        setFormData({
          name: product.name,
          description: product.description || '',
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          images: product.images || [],
          categoryId: product.categoryId || '',
          stock: product.stock,
          sku: product.sku || '',
          status: product.status,
          tags: product.tags || [],
        });
      }
    }
    setIsLoading(false);
  };

  const handleChange = (field: keyof ProductCreateData, value: string | number | string[] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'acces a la galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - (formData.images?.length || 0),
      });

      if (!result.canceled && result.assets) {
        setIsUploading(true);
        const uploadedUrls: string[] = [];

        for (const asset of result.assets) {
          const url = await uploadImage(asset.uri);
          if (url) {
            uploadedUrls.push(url);
          }
        }

        if (uploadedUrls.length > 0) {
          setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), ...uploadedUrls],
          }));
        }

        setIsUploading(false);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      setIsUploading(false);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom du produit est requis');
      return;
    }

    if (formData.price <= 0) {
      Alert.alert('Erreur', 'Le prix doit etre superieur a 0');
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing && productId) {
        const updated = await updateProduct(productId, formData);
        if (updated) {
          Alert.alert('Succes', 'Produit mis a jour', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('Erreur', 'Impossible de mettre a jour le produit');
        }
      } else {
        const created = await addProduct(formData);
        if (created) {
          Alert.alert('Succes', 'Produit ajoute', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        } else {
          Alert.alert('Erreur', 'Impossible d\'ajouter le produit');
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === formData.categoryId);

  const statusOptions: { value: VendorProductStatus; label: string }[] = [
    { value: 'active', label: 'Actif' },
    { value: 'draft', label: 'Brouillon' },
    { value: 'paused', label: 'En pause' },
  ];

  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Images</Text>
            <Text style={styles.sectionSubtitle}>
              Ajoutez jusqu'a 5 images pour votre produit
            </Text>

            <View style={styles.imagesGrid}>
              {formData.images?.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.productImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.mainImageBadge}>
                      <Text style={styles.mainImageText}>Principale</Text>
                    </View>
                  )}
                </View>
              ))}

              {(formData.images?.length || 0) < 5 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={pickImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator color={theme.colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="add" size={32} color={theme.colors.primary} />
                      <Text style={styles.addImageText}>Ajouter</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations</Text>

            <Text style={styles.label}>Nom du produit *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              placeholder="Ex: T-shirt en coton bio"
              placeholderTextColor={theme.colors.textTertiary}
            />

            <Text style={[styles.label, styles.marginTop]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              placeholder="Decrivez votre produit..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prix et stock</Text>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Prix *</Text>
                <View style={styles.priceInput}>
                  <Text style={styles.currencySymbol}>EUR</Text>
                  <TextInput
                    style={styles.priceInputField}
                    value={formData.price ? formData.price.toString() : ''}
                    onChangeText={(value) => handleChange('price', parseFloat(value) || 0)}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.halfField}>
                <Text style={styles.label}>Prix barre</Text>
                <View style={styles.priceInput}>
                  <Text style={styles.currencySymbol}>EUR</Text>
                  <TextInput
                    style={styles.priceInputField}
                    value={formData.compareAtPrice ? formData.compareAtPrice.toString() : ''}
                    onChangeText={(value) => handleChange('compareAtPrice', parseFloat(value) || undefined)}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Stock *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.stock ? formData.stock.toString() : ''}
                  onChangeText={(value) => handleChange('stock', parseInt(value) || 0)}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.halfField}>
                <Text style={styles.label}>SKU</Text>
                <TextInput
                  style={styles.input}
                  value={formData.sku}
                  onChangeText={(value) => handleChange('sku', value)}
                  placeholder="REF-001"
                  placeholderTextColor={theme.colors.textTertiary}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categorie</Text>

            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={[
                styles.selectButtonText,
                !selectedCategory && styles.selectButtonPlaceholder,
              ]}>
                {selectedCategory?.name || 'Selectionner une categorie'}
              </Text>
              <Ionicons
                name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.categoryList}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      formData.categoryId === category.id && styles.categoryItemSelected,
                    ]}
                    onPress={() => {
                      handleChange('categoryId', category.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.categoryItemText,
                      formData.categoryId === category.id && styles.categoryItemTextSelected,
                    ]}>
                      {category.name}
                    </Text>
                    {formData.categoryId === category.id && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statut</Text>

            <View style={styles.statusOptions}>
              {statusOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusOption,
                    formData.status === option.value && styles.statusOptionSelected,
                  ]}
                  onPress={() => handleChange('status', option.value)}
                >
                  <View style={[
                    styles.statusRadio,
                    formData.status === option.value && styles.statusRadioSelected,
                  ]}>
                    {formData.status === option.value && (
                      <View style={styles.statusRadioInner} />
                    )}
                  </View>
                  <Text style={[
                    styles.statusOptionText,
                    formData.status === option.value && styles.statusOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Enregistrer les modifications' : 'Ajouter le produit'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    section: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 8,
    },
    marginTop: {
      marginTop: 16,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    imagesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    imageContainer: {
      width: 100,
      height: 100,
      borderRadius: 12,
      overflow: 'hidden',
    },
    productImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    removeImageButton: {
      position: 'absolute',
      top: 4,
      right: 4,
    },
    mainImageBadge: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      paddingVertical: 2,
    },
    mainImageText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#fff',
      textAlign: 'center',
    },
    addImageButton: {
      width: 100,
      height: 100,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addImageText: {
      fontSize: 12,
      color: theme.colors.primary,
      marginTop: 4,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    halfField: {
      flex: 1,
    },
    priceInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      overflow: 'hidden',
    },
    currencySymbol: {
      paddingHorizontal: 12,
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      backgroundColor: theme.colors.background,
    },
    priceInputField: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
    },
    selectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    selectButtonText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    selectButtonPlaceholder: {
      color: theme.colors.textTertiary,
    },
    categoryList: {
      marginTop: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    categoryItemSelected: {
      backgroundColor: theme.colors.primary + '10',
    },
    categoryItemText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    categoryItemTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    statusOptions: {
      gap: 12,
    },
    statusOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      gap: 12,
    },
    statusOptionSelected: {},
    statusRadio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusRadioSelected: {
      borderColor: theme.colors.primary,
    },
    statusRadioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    statusOptionText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    statusOptionTextSelected: {
      fontWeight: '600',
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      marginHorizontal: 20,
      marginTop: 24,
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });

export default AddEditProductScreen;

/**
 * My Shop Screen
 * Create and manage vendor's shop
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
import { useShop, useImageUpload } from '../../contexts/VendorContext';
import { ShopCreateData, ShopUpdateData } from '../../types/vendor';

export function MyShopScreen() {
  const theme = useTheme();
  const { shop, isLoading, getMyShop, createShop, updateShop } = useShop();
  const { uploadImage } = useImageUpload();

  const [formData, setFormData] = useState<ShopCreateData>({
    name: '',
    description: '',
    logo: '',
    banner: '',
    address: '',
    phone: '',
    email: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadShop();
  }, []);

  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name || '',
        description: shop.description || '',
        logo: shop.logo || '',
        banner: shop.banner || '',
        address: shop.address || '',
        phone: shop.phone || '',
        email: shop.email || '',
      });
    }
  }, [shop]);

  const loadShop = async () => {
    await getMyShop();
  };

  const handleChange = (field: keyof ShopCreateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async (field: 'logo' | 'banner') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'acces a la galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: field === 'logo' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const imageUri = result.assets[0].uri;
        const uploadedUrl = await uploadImage(imageUri);

        if (uploadedUrl) {
          setFormData(prev => ({ ...prev, [field]: uploadedUrl }));
        } else {
          Alert.alert('Erreur', 'Impossible de telecharger l\'image');
        }
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setIsUploading(false);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom de la boutique est requis');
      return;
    }

    setIsSaving(true);

    try {
      if (shop) {
        // Update existing shop
        const updated = await updateShop(shop.id, formData as ShopUpdateData);
        if (updated) {
          Alert.alert('Succes', 'Boutique mise a jour avec succes');
        } else {
          Alert.alert('Erreur', 'Impossible de mettre a jour la boutique');
        }
      } else {
        // Create new shop
        const created = await createShop(formData);
        if (created) {
          Alert.alert('Succes', 'Boutique creee avec succes');
        } else {
          Alert.alert('Erreur', 'Impossible de creer la boutique');
        }
      }
    } catch (error) {
      console.error('Error saving shop:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const styles = createStyles(theme);

  if (isLoading && !shop) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="storefront" size={32} color={theme.colors.primary} />
            <Text style={styles.title}>
              {shop ? 'Ma Boutique' : 'Creer ma Boutique'}
            </Text>
            <Text style={styles.subtitle}>
              {shop
                ? 'Modifiez les informations de votre boutique'
                : 'Configurez votre boutique pour commencer a vendre'}
            </Text>
          </View>

          {/* Banner Image */}
          <View style={styles.section}>
            <Text style={styles.label}>Banniere</Text>
            <TouchableOpacity
              style={styles.bannerContainer}
              onPress={() => pickImage('banner')}
              disabled={isUploading}
            >
              {formData.banner ? (
                <Image source={{ uri: formData.banner }} style={styles.bannerImage} />
              ) : (
                <View style={styles.bannerPlaceholder}>
                  <Ionicons name="image-outline" size={40} color={theme.colors.textTertiary} />
                  <Text style={styles.placeholderText}>Ajouter une banniere</Text>
                </View>
              )}
              {isUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.section}>
            <Text style={styles.label}>Logo</Text>
            <TouchableOpacity
              style={styles.logoContainer}
              onPress={() => pickImage('logo')}
              disabled={isUploading}
            >
              {formData.logo ? (
                <Image source={{ uri: formData.logo }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={theme.colors.textTertiary} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Shop Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Nom de la boutique *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleChange('name', value)}
              placeholder="Ma Super Boutique"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleChange('description', value)}
              placeholder="Decrivez votre boutique..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Contact Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations de contact</Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              placeholder="contact@maboutique.fr"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.label, styles.marginTop]}>Telephone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => handleChange('phone', value)}
              placeholder="+33 6 12 34 56 78"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="phone-pad"
            />

            <Text style={[styles.label, styles.marginTop]}>Adresse</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(value) => handleChange('address', value)}
              placeholder="123 Rue du Commerce, 75001 Paris"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          {/* Status Info */}
          {shop && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Statut</Text>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: shop.status === 'active' ? theme.colors.success + '20' : theme.colors.warning + '20' }
                ]}>
                  <Ionicons
                    name={shop.status === 'active' ? 'checkmark-circle' : 'time'}
                    size={16}
                    color={shop.status === 'active' ? theme.colors.success : theme.colors.warning}
                  />
                  <Text style={[
                    styles.statusText,
                    { color: shop.status === 'active' ? theme.colors.success : theme.colors.warning }
                  ]}>
                    {shop.status === 'active' ? 'Active' : 'En attente'}
                  </Text>
                </View>
              </View>
            </View>
          )}

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
                  {shop ? 'Enregistrer les modifications' : 'Creer ma boutique'}
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
      paddingBottom: 120,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loaderText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 12,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 12,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
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
    bannerContainer: {
      height: 150,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    bannerImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    bannerPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 14,
      color: theme.colors.textTertiary,
      marginTop: 8,
    },
    uploadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignSelf: 'center',
    },
    logoImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    logoPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statusContainer: {
      flexDirection: 'row',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      marginHorizontal: 20,
      marginTop: 20,
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

export default MyShopScreen;

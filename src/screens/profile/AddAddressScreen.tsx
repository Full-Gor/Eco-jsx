/**
 * Add/Edit Address Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { Button, Input } from '../../components/common';
import { useToast } from '../../components/common/Toast';
import { Header } from '../../components/layout';
import { useAuth } from '../../hooks';
import { ProfileStackParamList } from '../../navigation/types';
import { Address } from '../../types/common';

type AddAddressNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'AddAddress'>;
type AddAddressRouteProp = RouteProp<ProfileStackParamList, 'AddAddress'>;

interface FormErrors {
  firstName?: string;
  lastName?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

export function AddAddressScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AddAddressNavigationProp>();
  const route = useRoute<AddAddressRouteProp>();
  const { addresses, addAddress, updateAddress } = useAuth();
  const { showToast } = useToast();

  const editingId = route.params?.addressId;
  const existingAddress = editingId ? addresses.find((a) => a.id === editingId) : undefined;
  const isEditing = !!existingAddress;

  const [label, setLabel] = useState(existingAddress?.label || '');
  const [firstName, setFirstName] = useState(existingAddress?.firstName || '');
  const [lastName, setLastName] = useState(existingAddress?.lastName || '');
  const [company, setCompany] = useState(existingAddress?.company || '');
  const [street, setStreet] = useState(existingAddress?.street || '');
  const [street2, setStreet2] = useState(existingAddress?.street2 || '');
  const [city, setCity] = useState(existingAddress?.city || '');
  const [state, setState] = useState(existingAddress?.state || '');
  const [postalCode, setPostalCode] = useState(existingAddress?.postalCode || '');
  const [country, setCountry] = useState(existingAddress?.country || 'France');
  const [phone, setPhone] = useState(existingAddress?.phone || '');
  const [isDefault, setIsDefault] = useState(existingAddress?.isDefault || addresses.length === 0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!street.trim()) {
      newErrors.street = 'L\'adresse est requise';
    }

    if (!city.trim()) {
      newErrors.city = 'La ville est requise';
    }

    if (!postalCode.trim()) {
      newErrors.postalCode = 'Le code postal est requis';
    } else if (!/^\d{5}$/.test(postalCode.trim())) {
      newErrors.postalCode = 'Code postal invalide';
    }

    if (!country.trim()) {
      newErrors.country = 'Le pays est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const addressData: Omit<Address, 'id'> = {
        label: label.trim() || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim() || undefined,
        street: street.trim(),
        street2: street2.trim() || undefined,
        city: city.trim(),
        state: state.trim() || undefined,
        postalCode: postalCode.trim(),
        country: country.trim(),
        phone: phone.trim() || undefined,
        isDefault,
      };

      let result;
      if (isEditing && editingId) {
        result = await updateAddress(editingId, addressData);
      } else {
        result = await addAddress(addressData);
      }

      if (result.success) {
        showToast(isEditing ? 'Adresse mise à jour' : 'Adresse ajoutée', 'success');
        navigation.goBack();
      } else {
        showToast(result.error?.message || 'Erreur', 'error');
      }
    } catch (error) {
      showToast('Une erreur est survenue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((e) => ({ ...e, [field]: undefined }));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        showBack
        onBackPress={() => navigation.goBack()}
        title={isEditing ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: insets.bottom + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Libellé (optionnel)"
            placeholder="ex: Maison, Bureau..."
            value={label}
            onChangeText={setLabel}
            autoCapitalize="words"
            editable={!loading}
          />

          <View style={{ height: theme.spacing.md }} />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Prénom"
                placeholder="Jean"
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  clearError('firstName');
                }}
                autoCapitalize="words"
                autoComplete="given-name"
                error={errors.firstName}
                editable={!loading}
              />
            </View>
            <View style={{ width: theme.spacing.md }} />
            <View style={styles.halfInput}>
              <Input
                label="Nom"
                placeholder="Dupont"
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  clearError('lastName');
                }}
                autoCapitalize="words"
                autoComplete="family-name"
                error={errors.lastName}
                editable={!loading}
              />
            </View>
          </View>

          <View style={{ height: theme.spacing.md }} />

          <Input
            label="Société (optionnel)"
            placeholder="Nom de l'entreprise"
            value={company}
            onChangeText={setCompany}
            autoCapitalize="words"
            autoComplete="organization"
            editable={!loading}
          />

          <View style={{ height: theme.spacing.md }} />

          <Input
            label="Adresse"
            placeholder="123 rue de la Paix"
            value={street}
            onChangeText={(text) => {
              setStreet(text);
              clearError('street');
            }}
            autoCapitalize="words"
            autoComplete="street-address"
            error={errors.street}
            editable={!loading}
          />

          <View style={{ height: theme.spacing.md }} />

          <Input
            label="Complément d'adresse (optionnel)"
            placeholder="Bâtiment, étage, appartement..."
            value={street2}
            onChangeText={setStreet2}
            autoCapitalize="words"
            editable={!loading}
          />

          <View style={{ height: theme.spacing.md }} />

          <View style={styles.row}>
            <View style={styles.postalInput}>
              <Input
                label="Code postal"
                placeholder="75001"
                value={postalCode}
                onChangeText={(text) => {
                  setPostalCode(text);
                  clearError('postalCode');
                }}
                keyboardType="number-pad"
                autoComplete="postal-code"
                error={errors.postalCode}
                editable={!loading}
              />
            </View>
            <View style={{ width: theme.spacing.md }} />
            <View style={styles.cityInput}>
              <Input
                label="Ville"
                placeholder="Paris"
                value={city}
                onChangeText={(text) => {
                  setCity(text);
                  clearError('city');
                }}
                autoCapitalize="words"
                autoComplete="address-line2"
                error={errors.city}
                editable={!loading}
              />
            </View>
          </View>

          <View style={{ height: theme.spacing.md }} />

          <Input
            label="Pays"
            placeholder="France"
            value={country}
            onChangeText={(text) => {
              setCountry(text);
              clearError('country');
            }}
            autoCapitalize="words"
            autoComplete="country"
            error={errors.country}
            editable={!loading}
          />

          <View style={{ height: theme.spacing.md }} />

          <Input
            label="Téléphone (optionnel)"
            placeholder="06 12 34 56 78"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            editable={!loading}
          />

          <View style={{ height: theme.spacing.lg }} />

          <Button
            onPress={handleSave}
            loading={loading}
            size="lg"
            fullWidth
          >
            {isEditing ? 'Enregistrer les modifications' : 'Ajouter l\'adresse'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingTop: 24,
  },
  row: {
    flexDirection: 'row',
  },
  halfInput: {
    flex: 1,
  },
  postalInput: {
    flex: 0.4,
  },
  cityInput: {
    flex: 0.6,
  },
});

export default AddAddressScreen;

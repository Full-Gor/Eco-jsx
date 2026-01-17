/**
 * Edit Profile Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button, Input } from '../../components/common';
import { useToast } from '../../components/common/Toast';
import { Header } from '../../components/layout';
import { useAuth } from '../../hooks';
import { ProfileStackParamList } from '../../navigation/types';
import { isValidEmail, isValidPhone } from '../../utils';

type EditProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

export function EditProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<EditProfileNavigationProp>();
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasChanges = (): boolean => {
    return (
      firstName !== (user?.firstName || '') ||
      lastName !== (user?.lastName || '') ||
      email !== (user?.email || '') ||
      phone !== (user?.phone || '')
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email invalide';
    }

    if (phone && !isValidPhone(phone)) {
      newErrors.phone = 'Numéro de téléphone invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!hasChanges()) {
      navigation.goBack();
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });

      if (result.success) {
        showToast('Profil mis à jour', 'success');
        navigation.goBack();
      } else {
        showToast(result.error?.message || 'Échec de la mise à jour', 'error');
      }
    } catch (error) {
      showToast('Une erreur est survenue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const getUserInitials = (): string => {
    const f = firstName || user?.firstName || '';
    const l = lastName || user?.lastName || '';
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) return f.slice(0, 2).toUpperCase();
    return 'US';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        showBack
        onBackPress={() => navigation.goBack()}
        title="Modifier le profil"
        rightComponent={
          <Button
            variant="ghost"
            size="sm"
            onPress={handleSave}
            loading={loading}
            disabled={!hasChanges()}
          >
            Enregistrer
          </Button>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: theme.spacing.lg, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <TouchableOpacity style={styles.avatarSection}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.colors.primary + '20' },
                ]}
              >
                <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                  {getUserInitials()}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.editAvatarButton,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.changePhotoText, { color: theme.colors.primary }]}>
              Changer la photo
            </Text>
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
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

            <View style={{ height: theme.spacing.md }} />

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

            <View style={{ height: theme.spacing.md }} />

            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError('email');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              editable={!loading}
            />

            <View style={{ height: theme.spacing.md }} />

            <Input
              label="Téléphone"
              placeholder="06 12 34 56 78"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                clearError('phone');
              }}
              keyboardType="phone-pad"
              autoComplete="tel"
              error={errors.phone}
              editable={!loading}
            />
          </View>

          {/* Change password link */}
          <TouchableOpacity
            style={[styles.linkButton, { borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.linkButtonText, { color: theme.colors.text }]}>
              Changer le mot de passe
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 20,
    right: '35%',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    marginBottom: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  linkButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default EditProfileScreen;

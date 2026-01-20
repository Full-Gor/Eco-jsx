/**
 * Profile Screen
 * Enhanced with authentication and navigation
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeContext } from '../../theme';
import { Card, Modal, Button, IconToggleButton, PowerButton } from '../../components/common';
import { useToast } from '../../components/common/Toast';
import { useAuth } from '../../hooks';
import { ProfileStackParamList } from '../../navigation/types';

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
  badge?: number;
}

function MenuItem({ icon, label, value, onPress, showArrow = true, danger = false, badge }: MenuItemProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onPress} style={styles.menuItem} activeOpacity={0.7}>
      <View
        style={[
          styles.menuIcon,
          { backgroundColor: danger ? theme.colors.errorBackground : theme.colors.primary + '15' },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={danger ? theme.colors.error : theme.colors.primary}
        />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, { color: danger ? theme.colors.error : theme.colors.text }]}>
          {label}
        </Text>
        {value && (
          <Text style={[styles.menuValue, { color: theme.colors.textSecondary }]}>
            {value}
          </Text>
        )}
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeContext();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, isAuthenticated, logout, addresses, paymentMethods } = useAuth();
  const { showToast } = useToast();

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Settings toggle states for animations
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [languageToggle, setLanguageToggle] = useState(false);
  const [securityEnabled, setSecurityEnabled] = useState(true);

  const getThemeModeLabel = (): string => {
    switch (themeMode) {
      case 'light':
        return 'Clair';
      case 'dark':
        return 'Sombre';
      case 'system':
        return 'Système';
      default:
        return 'Système';
    }
  };

  const toggleThemeMode = () => {
    const modes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setLogoutModalVisible(false);
      showToast('Déconnexion réussie', 'success');
    } catch (error) {
      showToast('Erreur lors de la déconnexion', 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getUserDisplayName = (): string => {
    if (!user) return 'Utilisateur';
    if (user.displayName) return user.displayName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return 'Utilisateur';
  };

  const getUserEmail = (): string => {
    return user?.email || 'utilisateur@example.com';
  };

  const getUserInitials = (): string => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + theme.spacing.lg,
              backgroundColor: theme.colors.primary,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('EditProfile')}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.colors.textInverse },
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
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Ionicons name="camera-outline" size={16} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: theme.colors.textInverse }]}>
            {getUserDisplayName()}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textInverse + 'CC' }]}>
            {getUserEmail()}
          </Text>
          {user && !user.isEmailVerified && (
            <TouchableOpacity
              style={[styles.verifyBadge, { backgroundColor: theme.colors.warning }]}
            >
              <Ionicons name="alert-circle" size={14} color="#FFFFFF" />
              <Text style={styles.verifyBadgeText}>Email non vérifié</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile content */}
        <View style={[styles.content, { paddingHorizontal: theme.spacing.lg }]}>
          {/* Account section */}
          <Card variant="outlined" padding="none" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              Mon compte
            </Text>
            <MenuItem
              icon="person-outline"
              label="Modifier le profil"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <MenuItem
              icon="location-outline"
              label="Mes adresses"
              value={addresses.length > 0 ? `${addresses.length} adresse(s)` : undefined}
              onPress={() => navigation.navigate('Addresses')}
            />
            <MenuItem
              icon="card-outline"
              label="Moyens de paiement"
              value={paymentMethods.length > 0 ? `${paymentMethods.length} carte(s)` : undefined}
              onPress={() => navigation.navigate('PaymentMethods')}
            />
            <MenuItem
              icon="receipt-outline"
              label="Mes commandes"
              onPress={() => navigation.navigate('Orders')}
            />
          </Card>

          {/* Settings section - Icon buttons in 3D style */}
          <Card variant="outlined" padding="none" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              Paramètres
            </Text>
            {/* Notifications */}
            <View style={styles.settingsRow}>
              <IconToggleButton
                iconLeft="notifications-off-outline"
                iconRight="notifications-outline"
                value={notificationsEnabled}
                onPress={() => {
                  setNotificationsEnabled(!notificationsEnabled);
                  setTimeout(() => navigation.navigate('Notifications'), 300);
                }}
                size="md"
              />
            </View>
            {/* Theme */}
            <View style={styles.settingsRow}>
              <IconToggleButton
                iconLeft="sunny-outline"
                iconRight="moon-outline"
                value={theme.isDark}
                onPress={() => setThemeMode(theme.isDark ? 'light' : 'dark')}
                size="md"
              />
            </View>
            {/* Language */}
            <View style={styles.settingsRow}>
              <IconToggleButton
                iconLeft="language-outline"
                iconRight="globe-outline"
                value={languageToggle}
                onPress={() => {
                  setLanguageToggle(!languageToggle);
                  setTimeout(() => navigation.navigate('Language'), 300);
                }}
                size="md"
              />
            </View>
            {/* Security */}
            <View style={styles.settingsRow}>
              <IconToggleButton
                iconLeft="lock-open-outline"
                iconRight="lock-closed-outline"
                value={securityEnabled}
                onPress={() => {
                  setSecurityEnabled(!securityEnabled);
                  setTimeout(() => navigation.navigate('Security'), 300);
                }}
                size="md"
              />
            </View>
          </Card>

          {/* Support section */}
          <Card variant="outlined" padding="none" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              Aide & Support
            </Text>
            <MenuItem
              icon="help-circle-outline"
              label="Centre d'aide"
              onPress={() => navigation.navigate('Help')}
            />
            <MenuItem
              icon="chatbubble-outline"
              label="Nous contacter"
              onPress={() => navigation.navigate('Contact')}
            />
            <MenuItem
              icon="document-text-outline"
              label="Conditions d'utilisation"
              onPress={() => navigation.navigate('Terms')}
            />
            <MenuItem
              icon="shield-outline"
              label="Politique de confidentialité"
              onPress={() => navigation.navigate('Privacy')}
            />
          </Card>

          {/* Logout - Power Button */}
          {isAuthenticated && (
            <View style={styles.logoutSection}>
              <PowerButton
                onPress={() => setLogoutModalVisible(true)}
                size={70}
              />
            </View>
          )}

          {/* App version */}
          <Text style={[styles.version, { color: theme.colors.textTertiary }]}>
            Version 1.0.0 (Phase 2 - Auth & User)
          </Text>
        </View>
      </ScrollView>

      {/* Logout confirmation modal */}
      <Modal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        title="Se déconnecter"
        size="sm"
      >
        <Text style={[styles.modalText, { color: theme.colors.text }]}>
          Êtes-vous sûr de vouloir vous déconnecter ?
        </Text>
        <View style={styles.modalButtons}>
          <Button
            variant="ghost"
            onPress={() => setLogoutModalVisible(false)}
            style={{ flex: 1, marginRight: 8 }}
            disabled={isLoggingOut}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onPress={handleLogout}
            loading={isLoggingOut}
            style={{ flex: 1, marginLeft: 8 }}
          >
            Déconnexion
          </Button>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  verifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  verifyBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  content: {
    marginTop: -16,
  },
  section: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    padding: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  menuValue: {
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingLeft: '10%',
  },
  logoutSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
});

export default ProfileScreen;

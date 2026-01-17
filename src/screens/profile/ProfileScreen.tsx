/**
 * Profile Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeContext } from '../../theme';
import { Card } from '../../components/common';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

function MenuItem({ icon, label, value, onPress, showArrow = true, danger = false }: MenuItemProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onPress} style={styles.menuItem}>
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
          <View style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.colors.textInverse },
              ]}
            >
              <Ionicons name="person" size={40} color={theme.colors.primary} />
            </View>
            <TouchableOpacity
              style={[
                styles.editAvatarButton,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Ionicons name="camera-outline" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, { color: theme.colors.textInverse }]}>
            Utilisateur
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textInverse + 'CC' }]}>
            utilisateur@example.com
          </Text>
        </View>

        {/* Profile content */}
        <View style={[styles.content, { paddingHorizontal: theme.spacing.lg }]}>
          {/* Account section */}
          <Card variant="outlined" padding="none" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              Mon compte
            </Text>
            <MenuItem icon="person-outline" label="Modifier le profil" />
            <MenuItem icon="location-outline" label="Mes adresses" />
            <MenuItem icon="card-outline" label="Moyens de paiement" />
            <MenuItem icon="receipt-outline" label="Mes commandes" />
          </Card>

          {/* Settings section */}
          <Card variant="outlined" padding="none" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              Paramètres
            </Text>
            <MenuItem icon="notifications-outline" label="Notifications" />
            <MenuItem
              icon="moon-outline"
              label="Apparence"
              value={getThemeModeLabel()}
              onPress={toggleThemeMode}
            />
            <MenuItem icon="language-outline" label="Langue" value="Français" />
            <MenuItem icon="shield-outline" label="Confidentialité" />
          </Card>

          {/* Support section */}
          <Card variant="outlined" padding="none" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              Aide & Support
            </Text>
            <MenuItem icon="help-circle-outline" label="Centre d'aide" />
            <MenuItem icon="chatbubble-outline" label="Nous contacter" />
            <MenuItem icon="document-text-outline" label="Conditions d'utilisation" />
            <MenuItem icon="lock-closed-outline" label="Politique de confidentialité" />
          </Card>

          {/* Logout */}
          <Card variant="outlined" padding="none" style={styles.section}>
            <MenuItem
              icon="log-out-outline"
              label="Se déconnecter"
              showArrow={false}
              danger
            />
          </Card>

          {/* App version */}
          <Text style={[styles.version, { color: theme.colors.textTertiary }]}>
            Version 1.0.0 (Phase 1 - Foundation)
          </Text>
        </View>
      </ScrollView>
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
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 16,
    marginBottom: 32,
  },
});

export default ProfileScreen;

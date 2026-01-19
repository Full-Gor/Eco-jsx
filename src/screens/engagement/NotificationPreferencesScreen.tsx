/**
 * Notification Preferences Screen
 * Allows users to configure notification settings
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNotifications } from '../../contexts/NotificationContext';
import { PushNotificationPreferences } from '../../types/engagement';
import { Toggle } from '../../components/common';
import { useTheme } from '../../theme';

/** Preference item component */
interface PreferenceItemProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function PreferenceItem({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}: PreferenceItemProps) {
  const theme = useTheme();

  return (
    <View style={[styles.preferenceItem, disabled && styles.disabledItem]}>
      <View style={styles.preferenceContent}>
        <Text style={[styles.preferenceTitle, { color: theme.colors.text }, disabled && styles.disabledText]}>
          {title}
        </Text>
        <Text style={[styles.preferenceDescription, { color: theme.colors.textSecondary }, disabled && styles.disabledText]}>
          {description}
        </Text>
      </View>
      <Toggle
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        size="sm"
      />
    </View>
  );
}

export function NotificationPreferencesScreen() {
  const theme = useTheme();
  const {
    preferences,
    updatePreferences,
    toggleNotificationType,
    hasPermission,
    permissionStatus,
    requestPermission,
  } = useNotifications();

  const [isUpdating, setIsUpdating] = useState(false);

  /** Handle master toggle */
  const handleMasterToggle = useCallback(
    async (enabled: boolean) => {
      if (enabled && permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            'Notifications Disabled',
            'Please enable notifications in your device settings to receive updates.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      setIsUpdating(true);
      await updatePreferences({ enabled });
      setIsUpdating(false);
    },
    [permissionStatus, requestPermission, updatePreferences]
  );

  /** Handle individual toggle */
  const handleToggle = useCallback(
    async (key: keyof PushNotificationPreferences, value: boolean) => {
      setIsUpdating(true);
      await toggleNotificationType(key, value);
      setIsUpdating(false);
    },
    [toggleNotificationType]
  );

  /** Request permissions */
  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) {
      Alert.alert('Success', 'Notifications have been enabled.');
    } else {
      Alert.alert(
        'Permission Denied',
        'Please enable notifications in your device settings.',
        [{ text: 'OK' }]
      );
    }
  }, [requestPermission]);

  const isDisabled = !preferences.enabled || !hasPermission;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Permission Banner */}
      {!hasPermission && (
        <TouchableOpacity
          style={[styles.permissionBanner, { backgroundColor: theme.colors.warningBackground, borderColor: theme.colors.warning }]}
          onPress={handleRequestPermission}
        >
          <View style={styles.permissionContent}>
            <Text style={[styles.permissionTitle, { color: theme.colors.warning }]}>Activer les notifications</Text>
            <Text style={[styles.permissionDescription, { color: theme.colors.warning }]}>
              Appuyez pour activer les notifications et rester informé de vos commandes
            </Text>
          </View>
          <Text style={[styles.permissionArrow, { color: theme.colors.warning }]}>→</Text>
        </TouchableOpacity>
      )}

      {/* Master Toggle */}
      <View style={styles.section}>
        <View style={[styles.masterToggle, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.masterContent}>
            <Text style={[styles.masterTitle, { color: theme.colors.text }]}>Notifications Push</Text>
            <Text style={[styles.masterDescription, { color: theme.colors.textSecondary }]}>
              Recevez des notifications sur vos commandes, promotions et plus
            </Text>
          </View>
          <Toggle
            value={preferences.enabled && hasPermission}
            onValueChange={handleMasterToggle}
            disabled={isUpdating}
            size="sm"
          />
        </View>
      </View>

      {/* Order Notifications */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Commandes</Text>
        <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]}>
          <PreferenceItem
            title="Mises à jour de commandes"
            description="Changements de statut, mises à jour d'expédition et confirmations de livraison"
            value={preferences.orders}
            onValueChange={(value) => handleToggle('orders', value)}
            disabled={isDisabled}
          />
        </View>
      </View>

      {/* Marketing Notifications */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Promotions & Offres</Text>
        <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]}>
          <PreferenceItem
            title="Promotions"
            description="Soldes, remises et offres exclusives"
            value={preferences.promotions}
            onValueChange={(value) => handleToggle('promotions', value)}
            disabled={isDisabled}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <PreferenceItem
            title="Nouveautés"
            description="Soyez le premier à découvrir les nouveaux produits"
            value={preferences.newArrivals}
            onValueChange={(value) => handleToggle('newArrivals', value)}
            disabled={isDisabled}
          />
        </View>
      </View>

      {/* Wishlist Notifications */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Alertes Favoris</Text>
        <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]}>
          <PreferenceItem
            title="Baisses de prix"
            description="Soyez notifié quand les articles de vos favoris sont en solde"
            value={preferences.priceDrops}
            onValueChange={(value) => handleToggle('priceDrops', value)}
            disabled={isDisabled}
          />
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <PreferenceItem
            title="De retour en stock"
            description="Sachez quand les articles épuisés redeviennent disponibles"
            value={preferences.backInStock}
            onValueChange={(value) => handleToggle('backInStock', value)}
            disabled={isDisabled}
          />
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Support</Text>
        <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]}>
          <PreferenceItem
            title="Messages"
            description="Réponses du service client"
            value={preferences.messages}
            onValueChange={(value) => handleToggle('messages', value)}
            disabled={isDisabled}
          />
        </View>
      </View>

      {/* Quiet Hours */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Heures silencieuses</Text>
        <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]}>
          <PreferenceItem
            title="Activer les heures silencieuses"
            description="Suspendre les notifications non urgentes pendant les heures définies"
            value={preferences.quietHoursEnabled}
            onValueChange={(value) => handleToggle('quietHoursEnabled', value)}
            disabled={isDisabled}
          />
          {preferences.quietHoursEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.timeSettings}>
                <TouchableOpacity style={[styles.timePicker, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>Début</Text>
                  <Text style={[styles.timeValue, { color: theme.colors.text }]}>
                    {preferences.quietHoursStart || '22:00'}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.timeSeparator, { color: theme.colors.textSecondary }]}>à</Text>
                <TouchableOpacity style={[styles.timePicker, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>Fin</Text>
                  <Text style={[styles.timeValue, { color: theme.colors.text }]}>
                    {preferences.quietHoursEnd || '08:00'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Info Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
          Les notifications de commandes ne peuvent pas être complètement désactivées pour vous assurer de recevoir
          les mises à jour importantes concernant vos achats.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
  },
  permissionArrow: {
    fontSize: 20,
    marginLeft: 12,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  masterContent: {
    flex: 1,
    marginRight: 16,
  },
  masterTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  masterDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  preferenceContent: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.6,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  timeSettings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 16,
  },
  timePicker: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 14,
  },
  footer: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default NotificationPreferencesScreen;

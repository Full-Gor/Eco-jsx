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
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNotifications } from '../../contexts/NotificationContext';
import { PushNotificationPreferences } from '../../types/engagement';

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
  return (
    <View style={[styles.preferenceItem, disabled && styles.disabledItem]}>
      <View style={styles.preferenceContent}>
        <Text style={[styles.preferenceTitle, disabled && styles.disabledText]}>
          {title}
        </Text>
        <Text style={[styles.preferenceDescription, disabled && styles.disabledText]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
        thumbColor={value ? '#3B82F6' : '#F3F4F6'}
      />
    </View>
  );
}

export function NotificationPreferencesScreen() {
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
    <ScrollView style={styles.container}>
      {/* Permission Banner */}
      {!hasPermission && (
        <TouchableOpacity
          style={styles.permissionBanner}
          onPress={handleRequestPermission}
        >
          <View style={styles.permissionContent}>
            <Text style={styles.permissionTitle}>Enable Notifications</Text>
            <Text style={styles.permissionDescription}>
              Tap to enable notifications and stay updated on your orders
            </Text>
          </View>
          <Text style={styles.permissionArrow}>arrow-right</Text>
        </TouchableOpacity>
      )}

      {/* Master Toggle */}
      <View style={styles.section}>
        <View style={styles.masterToggle}>
          <View style={styles.masterContent}>
            <Text style={styles.masterTitle}>Push Notifications</Text>
            <Text style={styles.masterDescription}>
              Receive notifications about orders, promotions, and more
            </Text>
          </View>
          <Switch
            value={preferences.enabled && hasPermission}
            onValueChange={handleMasterToggle}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={preferences.enabled ? '#3B82F6' : '#F3F4F6'}
            disabled={isUpdating}
          />
        </View>
      </View>

      {/* Order Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Orders</Text>
        <View style={styles.sectionContent}>
          <PreferenceItem
            title="Order Updates"
            description="Status changes, shipping updates, and delivery confirmations"
            value={preferences.orders}
            onValueChange={(value) => handleToggle('orders', value)}
            disabled={isDisabled}
          />
        </View>
      </View>

      {/* Marketing Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Promotions & Offers</Text>
        <View style={styles.sectionContent}>
          <PreferenceItem
            title="Promotions"
            description="Sales, discounts, and exclusive offers"
            value={preferences.promotions}
            onValueChange={(value) => handleToggle('promotions', value)}
            disabled={isDisabled}
          />
          <View style={styles.divider} />
          <PreferenceItem
            title="New Arrivals"
            description="Be the first to know about new products"
            value={preferences.newArrivals}
            onValueChange={(value) => handleToggle('newArrivals', value)}
            disabled={isDisabled}
          />
        </View>
      </View>

      {/* Wishlist Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wishlist Alerts</Text>
        <View style={styles.sectionContent}>
          <PreferenceItem
            title="Price Drops"
            description="Get notified when items in your wishlist go on sale"
            value={preferences.priceDrops}
            onValueChange={(value) => handleToggle('priceDrops', value)}
            disabled={isDisabled}
          />
          <View style={styles.divider} />
          <PreferenceItem
            title="Back in Stock"
            description="Know when sold-out items become available again"
            value={preferences.backInStock}
            onValueChange={(value) => handleToggle('backInStock', value)}
            disabled={isDisabled}
          />
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.sectionContent}>
          <PreferenceItem
            title="Messages"
            description="Replies from customer support"
            value={preferences.messages}
            onValueChange={(value) => handleToggle('messages', value)}
            disabled={isDisabled}
          />
        </View>
      </View>

      {/* Quiet Hours */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiet Hours</Text>
        <View style={styles.sectionContent}>
          <PreferenceItem
            title="Enable Quiet Hours"
            description="Pause non-urgent notifications during set hours"
            value={preferences.quietHoursEnabled}
            onValueChange={(value) => handleToggle('quietHoursEnabled', value)}
            disabled={isDisabled}
          />
          {preferences.quietHoursEnabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.timeSettings}>
                <TouchableOpacity style={styles.timePicker}>
                  <Text style={styles.timeLabel}>Start</Text>
                  <Text style={styles.timeValue}>
                    {preferences.quietHoursStart || '22:00'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.timeSeparator}>to</Text>
                <TouchableOpacity style={styles.timePicker}>
                  <Text style={styles.timeLabel}>End</Text>
                  <Text style={styles.timeValue}>
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
        <Text style={styles.footerText}>
          Order notifications cannot be completely disabled to ensure you receive
          important updates about your purchases.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#B45309',
  },
  permissionArrow: {
    fontSize: 20,
    color: '#B45309',
    marginLeft: 12,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  masterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
    marginBottom: 4,
  },
  masterDescription: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#111827',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    minWidth: 80,
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timeSeparator: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default NotificationPreferencesScreen;

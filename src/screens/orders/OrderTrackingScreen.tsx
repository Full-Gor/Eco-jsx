/**
 * Order Tracking Screen
 * Shows detailed tracking information with timeline and events
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../theme';
import { useTracking } from '../../contexts/OrderContext';
import { ExtendedTrackingStatus, ExtendedTrackingEvent } from '../../types/order';

interface Props {
  navigation: any;
  route: {
    params: {
      orderId: string;
      trackingNumber: string;
      carrier?: string;
    };
  };
}

/** Tracking status colors */
const STATUS_COLORS: Record<ExtendedTrackingStatus, { bg: string; icon: string }> = {
  unknown: { bg: '#6B7280', icon: 'help-circle' },
  pre_transit: { bg: '#F59E0B', icon: 'time' },
  in_transit: { bg: '#3B82F6', icon: 'airplane' },
  out_for_delivery: { bg: '#10B981', icon: 'bicycle' },
  delivered: { bg: '#10B981', icon: 'checkmark-circle' },
  available_for_pickup: { bg: '#6366F1', icon: 'storefront' },
  return_to_sender: { bg: '#EF4444', icon: 'return-down-back' },
  failure: { bg: '#EF4444', icon: 'alert-circle' },
  cancelled: { bg: '#6B7280', icon: 'close-circle' },
};

/** Tracking status labels */
const STATUS_LABELS: Record<ExtendedTrackingStatus, string> = {
  unknown: 'Unknown',
  pre_transit: 'Pre-Transit',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  available_for_pickup: 'Available for Pickup',
  return_to_sender: 'Return to Sender',
  failure: 'Delivery Failed',
  cancelled: 'Cancelled',
};

export function OrderTrackingScreen({ navigation, route }: Props) {
  const { trackingNumber, carrier } = route.params;
  const theme = useTheme();
  const { tracking, isLoading, fetchTracking } = useTracking(trackingNumber, carrier);

  const handleCopyTrackingNumber = useCallback(async () => {
    await Clipboard.setStringAsync(trackingNumber);
    // You could show a toast here
  }, [trackingNumber]);

  const handleOpenCarrierSite = useCallback(() => {
    if (tracking?.trackingUrl) {
      Linking.openURL(tracking.trackingUrl);
    }
  }, [tracking?.trackingUrl]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Track my package: ${trackingNumber}${tracking?.trackingUrl ? `\n${tracking.trackingUrl}` : ''}`,
      });
    } catch (error) {
      // Sharing cancelled or failed
    }
  }, [trackingNumber, tracking?.trackingUrl]);

  const handleRefresh = useCallback(() => {
    fetchTracking(trackingNumber, carrier);
  }, [fetchTracking, trackingNumber, carrier]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    backButton: {
      padding: theme.spacing.xs,
      marginRight: theme.spacing.sm,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    headerButton: {
      padding: theme.spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      padding: theme.spacing.md,
    },
    statusCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    statusIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    statusTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    statusDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    estimatedDelivery: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
    },
    estimatedDeliveryText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.xs,
    },
    trackingInfoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    trackingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    trackingLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    trackingNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      fontFamily: 'monospace',
    },
    copyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.sm,
    },
    copyButtonText: {
      fontSize: 13,
      color: theme.colors.primary,
      marginLeft: 4,
    },
    carrierRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    carrierInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    carrierName: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    carrierLink: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    carrierLinkText: {
      fontSize: 13,
      color: theme.colors.primary,
      marginRight: 4,
    },
    eventsSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
    },
    eventsSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    eventsSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    eventsCount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    eventsList: {
      padding: theme.spacing.md,
    },
    eventItem: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
    },
    eventItemLast: {
      marginBottom: 0,
    },
    eventIconContainer: {
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    eventIcon: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
    },
    eventIconFirst: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    eventIconMuted: {
      backgroundColor: theme.colors.border,
    },
    eventLine: {
      width: 2,
      flex: 1,
      backgroundColor: theme.colors.border,
      marginTop: 4,
    },
    eventContent: {
      flex: 1,
    },
    eventDescription: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 2,
    },
    eventLocation: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    eventTimestamp: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    deliveryProof: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    deliveryProofTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    deliveryProofInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    deliveryProofText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: theme.spacing.sm,
    },
    lastUpdated: {
      textAlign: 'center',
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
    },
  });

  if (isLoading && !tracking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tracking</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = tracking?.status
    ? STATUS_COLORS[tracking.status]
    : STATUS_COLORS.unknown;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tracking</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleRefresh}>
            <Ionicons name="refresh-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Status */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconContainer, { backgroundColor: statusInfo.bg }]}>
            <Ionicons
              name={statusInfo.icon as any}
              size={40}
              color="#fff"
            />
          </View>
          <Text style={styles.statusTitle}>
            {tracking?.status ? STATUS_LABELS[tracking.status] : 'Loading...'}
          </Text>
          <Text style={styles.statusDescription}>
            {tracking?.statusDescription || 'Fetching tracking information...'}
          </Text>
          {tracking?.estimatedDelivery && (
            <View style={styles.estimatedDelivery}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.estimatedDeliveryText}>
                Estimated: {formatDate(tracking.estimatedDelivery)}
              </Text>
            </View>
          )}
        </View>

        {/* Tracking Number */}
        <View style={styles.trackingInfoCard}>
          <View style={styles.trackingRow}>
            <View>
              <Text style={styles.trackingLabel}>Tracking Number</Text>
              <Text style={styles.trackingNumber}>{trackingNumber}</Text>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyTrackingNumber}>
              <Ionicons name="copy-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>

          {tracking?.carrierName && (
            <View style={styles.carrierRow}>
              <View style={styles.carrierInfo}>
                <Ionicons name="business-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.carrierName}>{tracking.carrierName}</Text>
              </View>
              {tracking.trackingUrl && (
                <TouchableOpacity style={styles.carrierLink} onPress={handleOpenCarrierSite}>
                  <Text style={styles.carrierLinkText}>Track on site</Text>
                  <Ionicons name="open-outline" size={14} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Events Timeline */}
        {tracking?.events && tracking.events.length > 0 && (
          <View style={styles.eventsSection}>
            <View style={styles.eventsSectionHeader}>
              <Text style={styles.eventsSectionTitle}>Tracking History</Text>
              <Text style={styles.eventsCount}>{tracking.events.length} events</Text>
            </View>
            <View style={styles.eventsList}>
              {tracking.events.map((event, index) => (
                <View
                  key={`${event.timestamp}-${index}`}
                  style={[
                    styles.eventItem,
                    index === tracking.events.length - 1 && styles.eventItemLast,
                  ]}
                >
                  <View style={styles.eventIconContainer}>
                    <View
                      style={[
                        styles.eventIcon,
                        index === 0 && styles.eventIconFirst,
                        index > 0 && styles.eventIconMuted,
                      ]}
                    />
                    {index < tracking.events.length - 1 && <View style={styles.eventLine} />}
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventDescription}>{event.description}</Text>
                    {event.location && (
                      <Text style={styles.eventLocation}>{event.location}</Text>
                    )}
                    <Text style={styles.eventTimestamp}>{formatDate(event.timestamp)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Delivery Proof */}
        {tracking?.deliveryProof && (
          <View style={styles.deliveryProof}>
            <Text style={styles.deliveryProofTitle}>Delivery Confirmation</Text>
            {tracking.deliveryProof.signedBy && (
              <View style={styles.deliveryProofInfo}>
                <Ionicons name="person-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.deliveryProofText}>
                  Signed by: {tracking.deliveryProof.signedBy}
                </Text>
              </View>
            )}
            {tracking.deliveryProof.deliveredAt && (
              <View style={[styles.deliveryProofInfo, { marginTop: theme.spacing.xs }]}>
                <Ionicons name="time-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.deliveryProofText}>
                  {formatDate(tracking.deliveryProof.deliveredAt)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Last Updated */}
        {tracking?.lastUpdated && (
          <Text style={styles.lastUpdated}>
            Last updated: {formatDate(tracking.lastUpdated)}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default OrderTrackingScreen;

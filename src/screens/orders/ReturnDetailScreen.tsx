/**
 * Return Detail Screen
 * Shows return request details and status
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useReturn } from '../../contexts/OrderContext';
import { ReturnStatus, ReturnTimelineStep } from '../../types/order';

interface Props {
  navigation: any;
  route: {
    params: {
      returnId: string;
    };
  };
}

/** Return status colors */
const STATUS_COLORS: Record<ReturnStatus, string> = {
  pending: '#F59E0B',
  approved: '#3B82F6',
  rejected: '#EF4444',
  shipped: '#06B6D4',
  received: '#8B5CF6',
  inspecting: '#6366F1',
  refunded: '#10B981',
  exchanged: '#10B981',
};

/** Return status labels */
const STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  shipped: 'Return Shipped',
  received: 'Received',
  inspecting: 'Inspecting',
  refunded: 'Refunded',
  exchanged: 'Exchanged',
};

/** Return reason labels */
const REASON_LABELS: Record<string, string> = {
  defective: 'Product Defective',
  not_as_described: 'Not as Described',
  wrong_size: 'Wrong Size',
  changed_mind: 'Changed My Mind',
  arrived_late: 'Arrived Too Late',
  other: 'Other',
};

export function ReturnDetailScreen({ navigation, route }: Props) {
  const { returnId } = route.params;
  const theme = useTheme();
  const { returnRequest, isLoading, getTimeline } = useReturn(returnId);

  const timeline = returnRequest ? getTimeline(returnRequest) : [];

  const handleDownloadLabel = useCallback(() => {
    if (returnRequest?.returnLabelUrl) {
      Linking.openURL(returnRequest.returnLabelUrl);
    }
  }, [returnRequest?.returnLabelUrl]);

  const handleContactSupport = useCallback(() => {
    navigation.navigate('Help');
  }, [navigation]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      padding: theme.spacing.md,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
    },
    sectionHeader: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    sectionContent: {
      padding: theme.spacing.md,
    },
    statusCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    statusBadge: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      marginBottom: theme.spacing.md,
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    returnNumber: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    orderNumber: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    timelineContainer: {
      padding: theme.spacing.md,
    },
    timelineStep: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
    },
    timelineStepLast: {
      marginBottom: 0,
    },
    timelineIconContainer: {
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    timelineIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timelineIconCompleted: {
      backgroundColor: theme.colors.success,
    },
    timelineIconCurrent: {
      backgroundColor: theme.colors.primary,
    },
    timelineIconPending: {
      backgroundColor: theme.colors.border,
    },
    timelineLine: {
      width: 2,
      flex: 1,
      marginTop: 4,
    },
    timelineLineCompleted: {
      backgroundColor: theme.colors.success,
    },
    timelineLinePending: {
      backgroundColor: theme.colors.border,
    },
    timelineContent: {
      flex: 1,
      paddingTop: 2,
    },
    timelineTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    timelineTitleCurrent: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    timelineTitlePending: {
      color: theme.colors.textSecondary,
    },
    timelineTimestamp: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    timelineDescription: {
      fontSize: 12,
      color: theme.colors.error,
      marginTop: 4,
    },
    itemCard: {
      flexDirection: 'row',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    itemCardLast: {
      borderBottomWidth: 0,
    },
    itemImage: {
      width: 50,
      height: 50,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.background,
      marginRight: theme.spacing.md,
    },
    itemImagePlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemContent: {
      flex: 1,
    },
    itemName: {
      fontSize: 14,
      color: theme.colors.text,
      marginBottom: 2,
    },
    itemDetails: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    itemReason: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    returnLabelCard: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    returnLabelIcon: {
      marginBottom: theme.spacing.sm,
    },
    returnLabelTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    returnLabelText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    downloadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    downloadButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: theme.spacing.xs,
    },
    refundSection: {
      alignItems: 'center',
    },
    refundAmount: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.success,
      marginBottom: 4,
    },
    refundMethod: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    refundDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    addressText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 22,
    },
    commentText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 22,
    },
    photosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    photoImage: {
      width: 80,
      height: 80,
      borderRadius: theme.borderRadius.sm,
    },
    helpButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.md,
    },
    helpButtonText: {
      fontSize: 14,
      color: theme.colors.primary,
      marginLeft: theme.spacing.xs,
    },
  });

  if (isLoading && !returnRequest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Return Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!returnRequest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Return Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={{ color: theme.colors.error, marginTop: theme.spacing.md }}>
            Return request not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[returnRequest.status];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Return Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[returnRequest.status]}</Text>
          </View>
          <Text style={styles.returnNumber}>Return #{returnRequest.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.orderNumber}>Order #{returnRequest.orderNumber}</Text>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Return Status</Text>
          </View>
          <View style={styles.timelineContainer}>
            {timeline.map((step, index) => (
              <View
                key={step.id}
                style={[
                  styles.timelineStep,
                  index === timeline.length - 1 && styles.timelineStepLast,
                ]}
              >
                <View style={styles.timelineIconContainer}>
                  <View
                    style={[
                      styles.timelineIcon,
                      step.isCompleted && !step.isCurrent && styles.timelineIconCompleted,
                      step.isCurrent && styles.timelineIconCurrent,
                      !step.isCompleted && !step.isCurrent && styles.timelineIconPending,
                    ]}
                  >
                    {step.isCompleted ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : (
                      <Ionicons name="ellipse" size={8} color="#fff" />
                    )}
                  </View>
                  {index < timeline.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        step.isCompleted
                          ? styles.timelineLineCompleted
                          : styles.timelineLinePending,
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineTitle,
                      step.isCurrent && styles.timelineTitleCurrent,
                      !step.isCompleted && !step.isCurrent && styles.timelineTitlePending,
                    ]}
                  >
                    {step.title}
                  </Text>
                  {step.timestamp && (
                    <Text style={styles.timelineTimestamp}>{formatDate(step.timestamp)}</Text>
                  )}
                  {step.description && (
                    <Text style={styles.timelineDescription}>{step.description}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Return Label (if approved) */}
        {returnRequest.status === 'approved' && returnRequest.returnLabelUrl && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Return Label</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.returnLabelCard}>
                <Ionicons
                  name="document-text-outline"
                  size={40}
                  color={theme.colors.primary}
                  style={styles.returnLabelIcon}
                />
                <Text style={styles.returnLabelTitle}>Your return label is ready</Text>
                <Text style={styles.returnLabelText}>
                  Print this label and attach it to your package before shipping.
                </Text>
                <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadLabel}>
                  <Ionicons name="download-outline" size={18} color="#fff" />
                  <Text style={styles.downloadButtonText}>Download Label</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Refund Info (if refunded) */}
        {returnRequest.status === 'refunded' && returnRequest.refundAmount && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Refund</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.refundSection}>
                <Text style={styles.refundAmount}>{returnRequest.refundAmount.formatted}</Text>
                <Text style={styles.refundMethod}>
                  {returnRequest.refundMethod === 'original'
                    ? 'Refunded to original payment method'
                    : 'Added to store credit'}
                </Text>
                {returnRequest.refundedAt && (
                  <Text style={styles.refundDate}>
                    Refunded on {formatDate(returnRequest.refundedAt)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items ({returnRequest.items.length})</Text>
          </View>
          <View style={styles.sectionContent}>
            {returnRequest.items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  index === returnRequest.items.length - 1 && styles.itemCardLast,
                ]}
              >
                {item.productImage ? (
                  <Image source={{ uri: item.productImage }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Ionicons name="cube-outline" size={20} color={theme.colors.textSecondary} />
                  </View>
                )}
                <View style={styles.itemContent}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                  <Text style={styles.itemDetails}>
                    {item.variantName ? `${item.variantName} • ` : ''}Qty: {item.quantity}
                  </Text>
                  <Text style={styles.itemReason}>
                    Reason: {REASON_LABELS[item.reason] || item.reason}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Return Address (if approved) */}
        {returnRequest.status === 'approved' && returnRequest.returnAddress && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Return Address</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.addressText}>
                {returnRequest.returnAddress.firstName} {returnRequest.returnAddress.lastName}
                {'\n'}
                {returnRequest.returnAddress.street}
                {returnRequest.returnAddress.street2 ? `\n${returnRequest.returnAddress.street2}` : ''}
                {'\n'}
                {returnRequest.returnAddress.postalCode} {returnRequest.returnAddress.city}
                {'\n'}
                {returnRequest.returnAddress.country}
              </Text>
            </View>
          </View>
        )}

        {/* Comment */}
        {returnRequest.comment && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Comments</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.commentText}>{returnRequest.comment}</Text>
            </View>
          </View>
        )}

        {/* Photos */}
        {returnRequest.photos && returnRequest.photos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Photos</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.photosGrid}>
                {returnRequest.photos.map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={styles.photoImage} />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Help Button */}
        <TouchableOpacity style={styles.helpButton} onPress={handleContactSupport}>
          <Ionicons name="help-circle-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.helpButtonText}>Need Help?</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ReturnDetailScreen;

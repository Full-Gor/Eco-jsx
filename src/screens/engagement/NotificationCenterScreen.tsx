/**
 * Notification Center Screen
 * Displays in-app notifications with swipe actions
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationItem, NotificationType } from '../../types/engagement';

/** Notification type icons */
const TYPE_ICONS: Record<NotificationType, string> = {
  order: 'box',
  promo: 'tag',
  product: 'shopping-bag',
  message: 'message-circle',
  system: 'bell',
  review: 'star',
};

/** Notification type colors */
const TYPE_COLORS: Record<NotificationType, string> = {
  order: '#3B82F6',
  promo: '#F59E0B',
  product: '#10B981',
  message: '#8B5CF6',
  system: '#6B7280',
  review: '#EC4899',
};

/** Format relative time */
const formatRelativeTime = (dateInput: string | Date): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export function NotificationCenterScreen() {
  const navigation = useNavigation<any>();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  /** Handle notification press */
  const handleNotificationPress = useCallback(
    async (notification: NotificationItem) => {
      // Mark as read
      if (!notification.read) {
        await markAsRead(notification.id);
      }

      // Navigate based on action
      if (notification.action && notification.actionId) {
        switch (notification.action) {
          case 'open_order':
            navigation.navigate('OrderDetail', { orderId: notification.actionId });
            break;
          case 'open_product':
            navigation.navigate('ProductDetail', { productId: notification.actionId });
            break;
          case 'open_promo':
            navigation.navigate('Promo', { promoId: notification.actionId });
            break;
          case 'open_chat':
            navigation.navigate('Chat', { chatId: notification.actionId });
            break;
          case 'open_review':
            navigation.navigate('ProductDetail', {
              productId: notification.actionId,
              scrollToReviews: true,
            });
            break;
          case 'open_wishlist':
            navigation.navigate('Wishlist');
            break;
        }
      }
    },
    [markAsRead, navigation]
  );

  /** Handle delete */
  const handleDelete = useCallback(
    (notificationId: string) => {
      deleteNotification(notificationId);
    },
    [deleteNotification]
  );

  /** Handle mark all as read */
  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  /** Handle clear all */
  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearAllNotifications,
        },
      ]
    );
  }, [clearAllNotifications]);

  /** Render swipe actions */
  const renderRightActions = useCallback(
    (notificationId: string) => (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => handleDelete(notificationId)}
      >
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    ),
    [handleDelete]
  );

  /** Render notification item */
  const renderNotification = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <Swipeable renderRightActions={() => renderRightActions(item.id)}>
        <TouchableOpacity
          style={[styles.notificationItem, !item.read && styles.unreadItem]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          {/* Type indicator */}
          <View
            style={[
              styles.typeIndicator,
              { backgroundColor: TYPE_COLORS[item.type] },
            ]}
          >
            <Text style={styles.typeIcon}>{TYPE_ICONS[item.type]}</Text>
          </View>

          {/* Content */}
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text
                style={[styles.notificationTitle, !item.read && styles.unreadText]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.notificationTime}>
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>
            <Text style={styles.notificationBody} numberOfLines={2}>
              {item.body}
            </Text>
          </View>

          {/* Image */}
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.notificationImage} />
          )}

          {/* Unread indicator */}
          {!item.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Swipeable>
    ),
    [handleNotificationPress, renderRightActions]
  );

  /** Empty state */
  const renderEmptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>bell-off</Text>
        <Text style={styles.emptyTitle}>No notifications</Text>
        <Text style={styles.emptySubtitle}>
          You're all caught up! We'll notify you when something important happens.
        </Text>
      </View>
    ),
    []
  );

  /** Header */
  const renderHeader = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleMarkAllAsRead}
              >
                <Text style={styles.headerButtonText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerButton} onPress={handleClearAll}>
              <Text style={[styles.headerButtonText, styles.clearAllText]}>
                Clear all
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ),
    [notifications.length, unreadCount, handleMarkAllAsRead, handleClearAll]
  );

  return (
    <View style={styles.container}>
      {renderHeader}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchNotifications} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  headerButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  clearAllText: {
    color: '#EF4444',
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadItem: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  typeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '600',
    color: '#111827',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  notificationBody: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  notificationImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 4,
    marginRight: 16,
    borderRadius: 12,
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    color: '#D1D5DB',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationCenterScreen;

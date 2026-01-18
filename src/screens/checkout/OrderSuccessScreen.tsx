/**
 * Order Success Screen
 * Displayed after successful order placement
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { CartStackScreenProps } from '../../navigation/types';
import { Button } from '../../components/common';

type Props = CartStackScreenProps<'OrderSuccess'>;

export function OrderSuccessScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { orderId } = route.params;

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate success icon
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [scaleAnim, fadeAnim, slideAnim]);

  const handleContinueShopping = () => {
    // Navigate to home and reset the cart stack
    navigation.reset({
      index: 0,
      routes: [{ name: 'CartScreen' }],
    });
    // Then navigate to home tab
    navigation.getParent()?.navigate('Home');
  };

  const handleViewOrder = () => {
    // Navigate to order details in profile stack
    navigation.getParent()?.getParent()?.navigate('Profile', {
      screen: 'OrderDetails',
      params: { orderId },
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.success + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.xl,
    },
    iconInner: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      lineHeight: 24,
    },
    orderIdContainer: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
    },
    orderIdLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginRight: theme.spacing.sm,
    },
    orderIdValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    copyButton: {
      marginLeft: theme.spacing.md,
      padding: theme.spacing.xs,
    },
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      width: '100%',
      marginBottom: theme.spacing.xl,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    infoIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    infoContent: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    infoSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    actionsContainer: {
      width: '100%',
    },
    viewOrderButton: {
      marginBottom: theme.spacing.md,
    },
    continueButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    continueButtonText: {
      color: theme.colors.text,
    },
    confettiContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.iconInner}>
            <Ionicons name="checkmark" size={40} color={theme.colors.surface} />
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text style={styles.title}>Order Confirmed!</Text>
          <Text style={styles.subtitle}>
            Thank you for your purchase. We've received your order and will start processing it right away.
          </Text>

          <View style={styles.orderIdContainer}>
            <Text style={styles.orderIdLabel}>Order ID:</Text>
            <Text style={styles.orderIdValue}>#{orderId.slice(0, 8).toUpperCase()}</Text>
            <TouchableOpacity style={styles.copyButton}>
              <Ionicons name="copy-outline" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="mail-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Confirmation Email</Text>
                <Text style={styles.infoSubtitle}>A confirmation email has been sent to your inbox</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="cube-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Shipping Updates</Text>
                <Text style={styles.infoSubtitle}>You'll receive updates when your order ships</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Estimated Delivery</Text>
                <Text style={styles.infoSubtitle}>Your order should arrive in 3-5 business days</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <Button
              variant="primary"
              onPress={handleViewOrder}
              style={styles.viewOrderButton}
            >
              View Order Details
            </Button>
            <Button
              variant="outline"
              onPress={handleContinueShopping}
            >
              Continue Shopping
            </Button>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

export default OrderSuccessScreen;

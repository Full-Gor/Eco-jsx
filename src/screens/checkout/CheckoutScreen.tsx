/**
 * Checkout Screen
 * Multi-step checkout flow with Address, Shipping, Payment, Confirmation
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useCheckout, CheckoutProvider } from '../../contexts/CheckoutContext';
import { useCart } from '../../contexts/CartContext';
import { CartStackScreenProps } from '../../navigation/types';
import { CheckoutStep } from '../../types/cart';
import { AddressStep } from './steps/AddressStep';
import { ShippingStep } from './steps/ShippingStep';
import { PaymentStep } from './steps/PaymentStep';
import { ConfirmationStep } from './steps/ConfirmationStep';

type Props = CartStackScreenProps<'Checkout'>;

const STEP_LABELS: Record<CheckoutStep, string> = {
  address: 'Address',
  shipping: 'Shipping',
  payment: 'Payment',
  confirmation: 'Review',
};

const STEPS: CheckoutStep[] = ['address', 'shipping', 'payment', 'confirmation'];

function CheckoutContent({ navigation }: Props) {
  const theme = useTheme();
  const { items, summary } = useCart();
  const {
    currentStep,
    isLoading,
    error,
    canGoNext,
    canGoBack,
    goNext,
    goBack,
    goToStep,
    placeOrder,
    resetCheckout,
  } = useCheckout();

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0) {
      navigation.replace('CartScreen');
    }
  }, [items.length, navigation]);

  // Reset checkout on unmount
  useEffect(() => {
    return () => {
      resetCheckout();
    };
  }, [resetCheckout]);

  const handleBack = () => {
    if (canGoBack) {
      goBack();
    } else {
      navigation.goBack();
    }
  };

  const handleNext = async () => {
    if (currentStep === 'confirmation') {
      const order = await placeOrder();
      if (order) {
        navigation.replace('OrderSuccess', { orderId: order.id });
      }
    } else {
      goNext();
    }
  };

  const currentStepIndex = STEPS.indexOf(currentStep);

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
    stepIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    stepItem: {
      alignItems: 'center',
      flex: 1,
    },
    stepCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    stepCircleActive: {
      backgroundColor: theme.colors.primary,
    },
    stepCircleCompleted: {
      backgroundColor: theme.colors.success,
    },
    stepCircleInactive: {
      backgroundColor: theme.colors.border,
    },
    stepNumber: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.surface,
    },
    stepLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
    },
    stepLabelActive: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    stepLine: {
      flex: 0.5,
      height: 2,
      backgroundColor: theme.colors.border,
      marginHorizontal: -theme.spacing.sm,
      marginBottom: 12,
    },
    stepLineCompleted: {
      backgroundColor: theme.colors.success,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.md,
      paddingBottom: 120,
    },
    errorContainer: {
      backgroundColor: theme.colors.error + '15',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 14,
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    footerSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    totalLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    totalAmount: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    nextButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    nextButtonDisabled: {
      backgroundColor: theme.colors.border,
    },
    nextButtonText: {
      color: theme.colors.surface,
      fontSize: 16,
      fontWeight: '600',
      marginRight: theme.spacing.xs,
    },
  });

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isActive = index === currentStepIndex;
        const canNavigate = index < currentStepIndex;

        return (
          <React.Fragment key={step}>
            {index > 0 && (
              <View
                style={[
                  styles.stepLine,
                  isCompleted && styles.stepLineCompleted,
                ]}
              />
            )}
            <TouchableOpacity
              style={styles.stepItem}
              onPress={() => canNavigate && goToStep(step)}
              disabled={!canNavigate}
            >
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCompleted && styles.stepCircleCompleted,
                  !isActive && !isCompleted && styles.stepCircleInactive,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color={theme.colors.surface} />
                ) : (
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                ]}
              >
                {STEP_LABELS[step]}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'address':
        return <AddressStep />;
      case 'shipping':
        return <ShippingStep />;
      case 'payment':
        return <PaymentStep />;
      case 'confirmation':
        return <ConfirmationStep />;
      default:
        return null;
    }
  };

  const getNextButtonLabel = () => {
    switch (currentStep) {
      case 'address':
        return 'Continue to Shipping';
      case 'shipping':
        return 'Continue to Payment';
      case 'payment':
        return 'Review Order';
      case 'confirmation':
        return 'Place Order';
      default:
        return 'Continue';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      {renderStepIndicator()}

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {renderStepContent()}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{summary.total.formatted}</Text>
        </View>
        <TouchableOpacity
          style={[styles.nextButton, (!canGoNext || isLoading) && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!canGoNext || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.surface} size="small" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>{getNextButtonLabel()}</Text>
              <Ionicons name="arrow-forward" size={18} color={theme.colors.surface} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export function CheckoutScreen(props: Props) {
  return (
    <CheckoutProvider>
      <CheckoutContent {...props} />
    </CheckoutProvider>
  );
}

export default CheckoutScreen;

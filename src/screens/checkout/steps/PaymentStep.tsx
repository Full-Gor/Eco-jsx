/**
 * Payment Step
 * Select payment method or add new card
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { useCheckout } from '../../../contexts/CheckoutContext';
import { SavedPaymentMethod, PaymentMethod } from '../../../types/cart';
import { useAuth } from '../../../contexts/AuthContext';

interface CardFormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

const initialCardForm: CardFormData = {
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  cardholderName: '',
};

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, string> = {
  card: 'card',
  paypal: 'logo-paypal',
  apple_pay: 'logo-apple',
  google_pay: 'logo-google',
  klarna: 'wallet',
  bank_transfer: 'business',
};

const CARD_BRAND_ICONS: Record<string, string> = {
  visa: 'card',
  mastercard: 'card',
  amex: 'card',
};

export function PaymentStep() {
  const theme = useTheme();
  const { user } = useAuth();
  const {
    state,
    paymentMethods,
    isLoading,
    loadPaymentMethods,
    selectPaymentMethod,
    setUseNewCard,
    setSaveCard,
  } = useCheckout();

  const [cardForm, setCardForm] = useState<CardFormData>(initialCardForm);
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentMethod>('card');

  // Load payment methods on mount
  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user, loadPaymentMethods]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    paymentTypeRow: {
      flexDirection: 'row',
      marginBottom: theme.spacing.lg,
    },
    paymentTypeButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      marginHorizontal: theme.spacing.xs,
      backgroundColor: theme.colors.surface,
    },
    paymentTypeButtonSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    paymentTypeIcon: {
      marginBottom: theme.spacing.xs,
    },
    paymentTypeText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    paymentTypeTextSelected: {
      color: theme.colors.primary,
    },
    savedCardsList: {
      marginBottom: theme.spacing.lg,
    },
    savedCardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
    },
    savedCardItemSelected: {
      borderColor: theme.colors.primary,
    },
    radioContainer: {
      marginRight: theme.spacing.md,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterSelected: {
      borderColor: theme.colors.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    cardIconContainer: {
      width: 40,
      height: 28,
      borderRadius: 4,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    savedCardContent: {
      flex: 1,
    },
    savedCardNumber: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    savedCardExpiry: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    defaultBadge: {
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    defaultBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    addNewCardButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.lg,
    },
    addNewCardText: {
      fontSize: 14,
      color: theme.colors.primary,
      marginLeft: theme.spacing.sm,
    },
    cardForm: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    formTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    inputContainer: {
      marginBottom: theme.spacing.md,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    input: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: 14,
      color: theme.colors.text,
    },
    formRow: {
      flexDirection: 'row',
      marginHorizontal: -theme.spacing.xs,
    },
    formColumn: {
      flex: 1,
      paddingHorizontal: theme.spacing.xs,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.sm,
    },
    checkboxChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    checkboxLabel: {
      fontSize: 14,
      color: theme.colors.text,
    },
    paypalSection: {
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
    },
    paypalIcon: {
      marginBottom: theme.spacing.md,
    },
    paypalText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    secureNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.success + '10',
      borderRadius: theme.borderRadius.md,
    },
    secureNoticeText: {
      fontSize: 12,
      color: theme.colors.success,
      marginLeft: theme.spacing.sm,
    },
  });

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : '';
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (value: string) => {
    setCardForm(prev => ({ ...prev, cardNumber: formatCardNumber(value) }));
  };

  const handleExpiryChange = (value: string) => {
    setCardForm(prev => ({ ...prev, expiryDate: formatExpiryDate(value) }));
  };

  const handleCvvChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').substring(0, 4);
    setCardForm(prev => ({ ...prev, cvv: cleaned }));
  };

  const handleNameChange = (value: string) => {
    setCardForm(prev => ({ ...prev, cardholderName: value }));
  };

  const handleSelectSavedCard = (method: SavedPaymentMethod) => {
    selectPaymentMethod(method);
    setUseNewCard(false);
  };

  const handleUseNewCard = () => {
    selectPaymentMethod(null);
    setUseNewCard(true);
  };

  const handlePaymentTypeSelect = (type: PaymentMethod) => {
    setSelectedPaymentType(type);
    if (type !== 'card') {
      selectPaymentMethod({
        id: type,
        type: type,
        isDefault: false,
      });
    } else {
      selectPaymentMethod(null);
    }
  };

  const renderPaymentTypeSelector = () => (
    <View style={styles.paymentTypeRow}>
      <TouchableOpacity
        style={[
          styles.paymentTypeButton,
          selectedPaymentType === 'card' && styles.paymentTypeButtonSelected,
        ]}
        onPress={() => handlePaymentTypeSelect('card')}
      >
        <Ionicons
          name="card"
          size={24}
          color={selectedPaymentType === 'card' ? theme.colors.primary : theme.colors.textSecondary}
          style={styles.paymentTypeIcon}
        />
        <Text
          style={[
            styles.paymentTypeText,
            selectedPaymentType === 'card' && styles.paymentTypeTextSelected,
          ]}
        >
          Card
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.paymentTypeButton,
          selectedPaymentType === 'paypal' && styles.paymentTypeButtonSelected,
        ]}
        onPress={() => handlePaymentTypeSelect('paypal')}
      >
        <Ionicons
          name="logo-paypal"
          size={24}
          color={selectedPaymentType === 'paypal' ? theme.colors.primary : theme.colors.textSecondary}
          style={styles.paymentTypeIcon}
        />
        <Text
          style={[
            styles.paymentTypeText,
            selectedPaymentType === 'paypal' && styles.paymentTypeTextSelected,
          ]}
        >
          PayPal
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.paymentTypeButton,
          selectedPaymentType === 'apple_pay' && styles.paymentTypeButtonSelected,
        ]}
        onPress={() => handlePaymentTypeSelect('apple_pay')}
      >
        <Ionicons
          name="logo-apple"
          size={24}
          color={selectedPaymentType === 'apple_pay' ? theme.colors.primary : theme.colors.textSecondary}
          style={styles.paymentTypeIcon}
        />
        <Text
          style={[
            styles.paymentTypeText,
            selectedPaymentType === 'apple_pay' && styles.paymentTypeTextSelected,
          ]}
        >
          Apple Pay
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSavedCards = () => {
    const cardMethods = paymentMethods.filter(m => m.type === 'card');
    if (cardMethods.length === 0) return null;

    return (
      <View style={styles.savedCardsList}>
        <Text style={styles.sectionTitle}>Saved Cards</Text>
        {cardMethods.map((method) => {
          const isSelected = state.paymentMethod?.id === method.id && !state.useNewCard;

          return (
            <TouchableOpacity
              key={method.id}
              style={[styles.savedCardItem, isSelected && styles.savedCardItemSelected]}
              onPress={() => handleSelectSavedCard(method)}
            >
              <View style={styles.radioContainer}>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>
              <View style={styles.cardIconContainer}>
                <Ionicons name="card" size={20} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.savedCardContent}>
                <Text style={styles.savedCardNumber}>
                  {method.brand?.toUpperCase() || 'Card'} •••• {method.lastFourDigits}
                </Text>
                <Text style={styles.savedCardExpiry}>
                  Expires {method.expiryMonth?.toString().padStart(2, '0')}/{method.expiryYear?.toString().slice(-2)}
                </Text>
              </View>
              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderCardForm = () => (
    <View style={styles.cardForm}>
      <Text style={styles.formTitle}>
        {paymentMethods.filter(m => m.type === 'card').length > 0 ? 'New Card' : 'Card Details'}
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Card Number</Text>
        <TextInput
          style={styles.input}
          value={cardForm.cardNumber}
          onChangeText={handleCardNumberChange}
          placeholder="1234 5678 9012 3456"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="numeric"
          maxLength={19}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Cardholder Name</Text>
        <TextInput
          style={styles.input}
          value={cardForm.cardholderName}
          onChangeText={handleNameChange}
          placeholder="JOHN DOE"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Expiry Date</Text>
            <TextInput
              style={styles.input}
              value={cardForm.expiryDate}
              onChangeText={handleExpiryChange}
              placeholder="MM/YY"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
        </View>
        <View style={styles.formColumn}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>CVV</Text>
            <TextInput
              style={styles.input}
              value={cardForm.cvv}
              onChangeText={handleCvvChange}
              placeholder="123"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>
      </View>

      {user && (
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setSaveCard(!state.saveCard)}
        >
          <View style={[styles.checkbox, state.saveCard && styles.checkboxChecked]}>
            {state.saveCard && (
              <Ionicons name="checkmark" size={14} color={theme.colors.surface} />
            )}
          </View>
          <Text style={styles.checkboxLabel}>Save card for future purchases</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPayPalSection = () => (
    <View style={styles.paypalSection}>
      <Ionicons
        name="logo-paypal"
        size={48}
        color="#003087"
        style={styles.paypalIcon}
      />
      <Text style={styles.paypalText}>
        You will be redirected to PayPal to complete your payment securely.
      </Text>
    </View>
  );

  const renderApplePaySection = () => (
    <View style={styles.paypalSection}>
      <Ionicons
        name="logo-apple"
        size={48}
        color={theme.colors.text}
        style={styles.paypalIcon}
      />
      <Text style={styles.paypalText}>
        Complete your purchase with Apple Pay using Touch ID or Face ID.
      </Text>
    </View>
  );

  if (isLoading && paymentMethods.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Payment Method</Text>

      {renderPaymentTypeSelector()}

      {selectedPaymentType === 'card' && (
        <>
          {renderSavedCards()}

          {paymentMethods.filter(m => m.type === 'card').length > 0 && !state.useNewCard && (
            <TouchableOpacity style={styles.addNewCardButton} onPress={handleUseNewCard}>
              <Ionicons name="add" size={20} color={theme.colors.primary} />
              <Text style={styles.addNewCardText}>Add New Card</Text>
            </TouchableOpacity>
          )}

          {(state.useNewCard || paymentMethods.filter(m => m.type === 'card').length === 0) && (
            renderCardForm()
          )}
        </>
      )}

      {selectedPaymentType === 'paypal' && renderPayPalSection()}
      {selectedPaymentType === 'apple_pay' && renderApplePaySection()}

      <View style={styles.secureNotice}>
        <Ionicons name="lock-closed" size={16} color={theme.colors.success} />
        <Text style={styles.secureNoticeText}>
          Your payment information is encrypted and secure
        </Text>
      </View>
    </View>
  );
}

export default PaymentStep;

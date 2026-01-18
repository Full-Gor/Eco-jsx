/**
 * Address Step
 * Select or add shipping and billing addresses
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme';
import { useCheckout } from '../../../contexts/CheckoutContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Address } from '../../../types/common';
import { Card, Button, Input } from '../../../components/common';

interface AddressFormData {
  firstName: string;
  lastName: string;
  street: string;
  street2: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

const initialFormData: AddressFormData = {
  firstName: '',
  lastName: '',
  street: '',
  street2: '',
  city: '',
  postalCode: '',
  country: 'FR',
  phone: '',
};

export function AddressStep() {
  const theme = useTheme();
  const { user } = useAuth();
  const {
    state,
    savedAddresses,
    setShippingAddress,
    setBillingAddress,
    setUseSameAddress,
  } = useCheckout();

  const [showNewAddressForm, setShowNewAddressForm] = useState(savedAddresses.length === 0);
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [billingFormData, setBillingFormData] = useState<AddressFormData>(initialFormData);

  // Pre-fill with user info if available
  useEffect(() => {
    if (user && !formData.firstName) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

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
    addressList: {
      marginBottom: theme.spacing.lg,
    },
    addressCard: {
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 2,
      borderColor: 'transparent',
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.surface,
    },
    addressCardSelected: {
      borderColor: theme.colors.primary,
    },
    addressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    addressLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
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
    addressName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    addressText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    radioContainer: {
      position: 'absolute',
      right: theme.spacing.md,
      top: theme.spacing.md,
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
    addNewButton: {
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
    addNewText: {
      fontSize: 14,
      color: theme.colors.primary,
      marginLeft: theme.spacing.sm,
    },
    formContainer: {
      marginBottom: theme.spacing.lg,
    },
    formRow: {
      flexDirection: 'row',
      marginHorizontal: -theme.spacing.xs,
    },
    formColumn: {
      flex: 1,
      paddingHorizontal: theme.spacing.xs,
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
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: 14,
      color: theme.colors.text,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
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
    billingSection: {
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });

  const handleSelectAddress = (address: Address) => {
    setShippingAddress(address);
    setShowNewAddressForm(false);
  };

  const handleFormChange = (field: keyof AddressFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Update shipping address as user types
    const address: Address = {
      id: 'new',
      firstName: field === 'firstName' ? value : formData.firstName,
      lastName: field === 'lastName' ? value : formData.lastName,
      street: field === 'street' ? value : formData.street,
      street2: field === 'street2' ? value : formData.street2,
      city: field === 'city' ? value : formData.city,
      postalCode: field === 'postalCode' ? value : formData.postalCode,
      country: field === 'country' ? value : formData.country,
      phone: field === 'phone' ? value : formData.phone,
    };

    if (address.firstName && address.lastName && address.street && address.city && address.postalCode) {
      setShippingAddress(address);
    }
  };

  const handleBillingFormChange = (field: keyof AddressFormData, value: string) => {
    setBillingFormData(prev => ({ ...prev, [field]: value }));

    const address: Address = {
      id: 'billing-new',
      firstName: field === 'firstName' ? value : billingFormData.firstName,
      lastName: field === 'lastName' ? value : billingFormData.lastName,
      street: field === 'street' ? value : billingFormData.street,
      street2: field === 'street2' ? value : billingFormData.street2,
      city: field === 'city' ? value : billingFormData.city,
      postalCode: field === 'postalCode' ? value : billingFormData.postalCode,
      country: field === 'country' ? value : billingFormData.country,
      phone: field === 'phone' ? value : billingFormData.phone,
    };

    if (address.firstName && address.lastName && address.street && address.city && address.postalCode) {
      setBillingAddress(address);
    }
  };

  const toggleUseSameAddress = () => {
    const newValue = !state.useSameAddress;
    setUseSameAddress(newValue);
    setShowBillingForm(!newValue);
  };

  const renderAddressCard = (address: Address, index: number) => {
    const isSelected = state.shippingAddress?.id === address.id;

    return (
      <TouchableOpacity
        key={address.id || index}
        style={[styles.addressCard, isSelected && styles.addressCardSelected]}
        onPress={() => handleSelectAddress(address)}
      >
        <View style={styles.addressHeader}>
          <Text style={styles.addressLabel}>
            {address.label || `Address ${index + 1}`}
          </Text>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
        <Text style={styles.addressName}>
          {address.firstName} {address.lastName}
        </Text>
        <Text style={styles.addressText}>
          {address.street}
          {address.street2 ? `, ${address.street2}` : ''}
        </Text>
        <Text style={styles.addressText}>
          {address.postalCode} {address.city}, {address.country}
        </Text>
        {address.phone && (
          <Text style={styles.addressText}>{address.phone}</Text>
        )}
        <View style={styles.radioContainer}>
          <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAddressForm = (
    data: AddressFormData,
    onChange: (field: keyof AddressFormData, value: string) => void,
    title: string
  ) => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={data.firstName}
              onChangeText={(value) => onChange('firstName', value)}
              placeholder="John"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>
        <View style={styles.formColumn}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={data.lastName}
              onChangeText={(value) => onChange('lastName', value)}
              placeholder="Doe"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Street Address *</Text>
        <TextInput
          style={styles.input}
          value={data.street}
          onChangeText={(value) => onChange('street', value)}
          placeholder="123 Main Street"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Apartment, Suite, etc.</Text>
        <TextInput
          style={styles.input}
          value={data.street2}
          onChangeText={(value) => onChange('street2', value)}
          placeholder="Apt 4B"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Postal Code *</Text>
            <TextInput
              style={styles.input}
              value={data.postalCode}
              onChangeText={(value) => onChange('postalCode', value)}
              placeholder="75001"
              keyboardType="numeric"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>
        <View style={styles.formColumn}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>City *</Text>
            <TextInput
              style={styles.input}
              value={data.city}
              onChangeText={(value) => onChange('city', value)}
              placeholder="Paris"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Country *</Text>
        <TextInput
          style={styles.input}
          value={data.country}
          onChangeText={(value) => onChange('country', value)}
          placeholder="France"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={data.phone}
          onChangeText={(value) => onChange('phone', value)}
          placeholder="+33 6 12 34 56 78"
          keyboardType="phone-pad"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Shipping Address</Text>

      {savedAddresses.length > 0 && !showNewAddressForm && (
        <View style={styles.addressList}>
          {savedAddresses.map((address, index) => renderAddressCard(address, index))}
        </View>
      )}

      {!showNewAddressForm && savedAddresses.length > 0 && (
        <TouchableOpacity
          style={styles.addNewButton}
          onPress={() => setShowNewAddressForm(true)}
        >
          <Ionicons name="add" size={20} color={theme.colors.primary} />
          <Text style={styles.addNewText}>Add New Address</Text>
        </TouchableOpacity>
      )}

      {(showNewAddressForm || savedAddresses.length === 0) && (
        <>
          {renderAddressForm(formData, handleFormChange, savedAddresses.length > 0 ? 'New Shipping Address' : 'Enter Shipping Address')}

          {savedAddresses.length > 0 && (
            <Button
              variant="ghost"
              onPress={() => setShowNewAddressForm(false)}
            >
              Use Saved Address
            </Button>
          )}
        </>
      )}

      <TouchableOpacity style={styles.checkboxContainer} onPress={toggleUseSameAddress}>
        <View style={[styles.checkbox, state.useSameAddress && styles.checkboxChecked]}>
          {state.useSameAddress && (
            <Ionicons name="checkmark" size={14} color={theme.colors.surface} />
          )}
        </View>
        <Text style={styles.checkboxLabel}>Billing address same as shipping</Text>
      </TouchableOpacity>

      {!state.useSameAddress && (
        <View style={styles.billingSection}>
          {renderAddressForm(billingFormData, handleBillingFormChange, 'Billing Address')}
        </View>
      )}
    </View>
  );
}

export default AddressStep;

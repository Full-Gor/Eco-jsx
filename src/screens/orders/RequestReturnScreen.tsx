/**
 * Request Return Screen
 * Allows users to request a return for delivered orders
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme';
import { useOrder, useReturn } from '../../contexts/OrderContext';
import { ReturnReason, CreateReturnData, OrderItem } from '../../types/order';

interface Props {
  navigation: any;
  route: {
    params: {
      orderId: string;
    };
  };
}

/** Return reason options */
const RETURN_REASONS: Array<{ value: ReturnReason; label: string; description: string }> = [
  {
    value: 'defective',
    label: 'Product Defective',
    description: 'The product arrived damaged or does not work properly',
  },
  {
    value: 'not_as_described',
    label: 'Not as Described',
    description: 'The product does not match the description or photos',
  },
  {
    value: 'wrong_size',
    label: 'Wrong Size',
    description: 'The size does not fit as expected',
  },
  {
    value: 'changed_mind',
    label: 'Changed My Mind',
    description: 'I no longer want this product',
  },
  {
    value: 'arrived_late',
    label: 'Arrived Too Late',
    description: 'The product arrived after I needed it',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Please specify in the comments',
  },
];

interface SelectedItem {
  orderItemId: string;
  quantity: number;
  reason: ReturnReason;
}

export function RequestReturnScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const theme = useTheme();
  const { order, isLoading: orderLoading } = useOrder(orderId);
  const { createReturn, isLoading: returnLoading } = useReturn();

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [resolution, setResolution] = useState<'refund' | 'exchange'>('refund');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [step, setStep] = useState<'items' | 'reason' | 'review'>('items');

  const isLoading = orderLoading || returnLoading;

  const toggleItem = useCallback((item: OrderItem) => {
    setSelectedItems((prev) => {
      const exists = prev.find((s) => s.orderItemId === item.id);
      if (exists) {
        return prev.filter((s) => s.orderItemId !== item.id);
      }
      return [...prev, { orderItemId: item.id, quantity: item.quantity, reason: 'changed_mind' }];
    });
  }, []);

  const updateItemQuantity = useCallback((orderItemId: string, quantity: number) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.orderItemId === orderItemId ? { ...item, quantity } : item))
    );
  }, []);

  const updateItemReason = useCallback((orderItemId: string, reason: ReturnReason) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.orderItemId === orderItemId ? { ...item, reason } : item))
    );
  }, []);

  const handleAddPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }, []);

  const handleRemovePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please select at least one item to return.');
      return;
    }

    const data: CreateReturnData = {
      orderId,
      items: selectedItems,
      resolution,
      comment: comment.trim() || undefined,
      photos: photos.length > 0 ? photos : undefined,
    };

    const result = await createReturn(data);

    if (result) {
      Alert.alert(
        'Return Requested',
        'Your return request has been submitted. We will review it and get back to you soon.',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('ReturnDetail', { returnId: result.id }),
          },
        ]
      );
    }
  }, [orderId, selectedItems, resolution, comment, photos, createReturn, navigation]);

  const canProceed = useMemo(() => {
    switch (step) {
      case 'items':
        return selectedItems.length > 0;
      case 'reason':
        return selectedItems.every((item) => item.reason);
      case 'review':
        return true;
      default:
        return false;
    }
  }, [step, selectedItems]);

  const handleNext = useCallback(() => {
    switch (step) {
      case 'items':
        setStep('reason');
        break;
      case 'reason':
        setStep('review');
        break;
      case 'review':
        handleSubmit();
        break;
    }
  }, [step, handleSubmit]);

  const handleBack = useCallback(() => {
    switch (step) {
      case 'reason':
        setStep('items');
        break;
      case 'review':
        setStep('reason');
        break;
      default:
        navigation.goBack();
    }
  }, [step, navigation]);

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
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.border,
      marginHorizontal: theme.spacing.xs,
    },
    stepDotActive: {
      backgroundColor: theme.colors.primary,
      width: 24,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      padding: theme.spacing.md,
      paddingBottom: 100,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    itemCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    itemCardSelected: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    itemCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    itemCheckboxSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    itemImage: {
      width: 60,
      height: 60,
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
    itemVariant: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    itemPrice: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    quantitySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    quantityLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginRight: theme.spacing.sm,
    },
    quantityButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginHorizontal: theme.spacing.md,
    },
    reasonCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    reasonCardSelected: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    reasonHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reasonRadio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    reasonRadioSelected: {
      borderColor: theme.colors.primary,
    },
    reasonRadioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
    reasonLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    reasonDescription: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 4,
      marginLeft: 36,
    },
    resolutionSection: {
      marginTop: theme.spacing.lg,
    },
    resolutionOptions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    resolutionOption: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    resolutionOptionSelected: {
      borderColor: theme.colors.primary,
    },
    resolutionIcon: {
      marginBottom: theme.spacing.sm,
    },
    resolutionLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    commentSection: {
      marginTop: theme.spacing.lg,
    },
    commentInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      fontSize: 14,
      color: theme.colors.text,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    photosSection: {
      marginTop: theme.spacing.lg,
    },
    photosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    photoCard: {
      width: 80,
      height: 80,
      borderRadius: theme.borderRadius.sm,
      overflow: 'hidden',
    },
    photoImage: {
      width: '100%',
      height: '100%',
    },
    photoRemove: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addPhotoButton: {
      width: 80,
      height: 80,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
    },
    addPhotoText: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    reviewSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    reviewLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    reviewValue: {
      fontSize: 14,
      color: theme.colors.text,
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
    footerButtons: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    button: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    primaryButtonDisabled: {
      backgroundColor: theme.colors.border,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600',
    },
    primaryButtonText: {
      color: '#fff',
    },
    secondaryButtonText: {
      color: theme.colors.text,
    },
  });

  if (isLoading && !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Return</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const getSelectedItem = (itemId: string) => selectedItems.find((s) => s.orderItemId === itemId);
  const getOrderItem = (orderItemId: string) => order?.items.find((i) => i.id === orderItemId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Return</Text>
      </View>

      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step === 'items' && styles.stepDotActive]} />
        <View style={[styles.stepDot, step === 'reason' && styles.stepDotActive]} />
        <View style={[styles.stepDot, step === 'review' && styles.stepDotActive]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 'items' && (
          <>
            <Text style={styles.sectionTitle}>Select items to return</Text>
            {order?.items.map((item) => {
              const selected = getSelectedItem(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, selected && styles.itemCardSelected]}
                  onPress={() => toggleItem(item)}
                >
                  <View style={[styles.itemCheckbox, selected && styles.itemCheckboxSelected]}>
                    {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  {item.productImage ? (
                    <Image source={{ uri: item.productImage }} style={styles.itemImage} />
                  ) : (
                    <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                      <Ionicons name="cube-outline" size={24} color={theme.colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                    {item.variantName && <Text style={styles.itemVariant}>{item.variantName}</Text>}
                    <Text style={styles.itemPrice}>{item.unitPrice.formatted}</Text>
                    {selected && (
                      <View style={styles.quantitySelector}>
                        <Text style={styles.quantityLabel}>Qty to return:</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() =>
                            updateItemQuantity(item.id, Math.max(1, selected.quantity - 1))
                          }
                        >
                          <Ionicons name="remove" size={16} color={theme.colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.quantityValue}>{selected.quantity}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() =>
                            updateItemQuantity(item.id, Math.min(item.quantity, selected.quantity + 1))
                          }
                        >
                          <Ionicons name="add" size={16} color={theme.colors.text} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {step === 'reason' && (
          <>
            <Text style={styles.sectionTitle}>Why are you returning?</Text>
            {selectedItems.map((selected) => {
              const item = getOrderItem(selected.orderItemId);
              if (!item) return null;

              return (
                <View key={selected.orderItemId} style={{ marginBottom: theme.spacing.lg }}>
                  <Text style={{ fontSize: 14, color: theme.colors.text, marginBottom: theme.spacing.sm }}>
                    {item.productName}
                  </Text>
                  {RETURN_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason.value}
                      style={[
                        styles.reasonCard,
                        selected.reason === reason.value && styles.reasonCardSelected,
                      ]}
                      onPress={() => updateItemReason(selected.orderItemId, reason.value)}
                    >
                      <View style={styles.reasonHeader}>
                        <View
                          style={[
                            styles.reasonRadio,
                            selected.reason === reason.value && styles.reasonRadioSelected,
                          ]}
                        >
                          {selected.reason === reason.value && (
                            <View style={styles.reasonRadioInner} />
                          )}
                        </View>
                        <Text style={styles.reasonLabel}>{reason.label}</Text>
                      </View>
                      <Text style={styles.reasonDescription}>{reason.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}

            <View style={styles.resolutionSection}>
              <Text style={styles.sectionTitle}>What would you prefer?</Text>
              <View style={styles.resolutionOptions}>
                <TouchableOpacity
                  style={[
                    styles.resolutionOption,
                    resolution === 'refund' && styles.resolutionOptionSelected,
                  ]}
                  onPress={() => setResolution('refund')}
                >
                  <Ionicons
                    name="cash-outline"
                    size={24}
                    color={resolution === 'refund' ? theme.colors.primary : theme.colors.textSecondary}
                    style={styles.resolutionIcon}
                  />
                  <Text style={styles.resolutionLabel}>Refund</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.resolutionOption,
                    resolution === 'exchange' && styles.resolutionOptionSelected,
                  ]}
                  onPress={() => setResolution('exchange')}
                >
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={24}
                    color={resolution === 'exchange' ? theme.colors.primary : theme.colors.textSecondary}
                    style={styles.resolutionIcon}
                  />
                  <Text style={styles.resolutionLabel}>Exchange</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {step === 'review' && (
          <>
            <Text style={styles.sectionTitle}>Review your return request</Text>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Items to return</Text>
              {selectedItems.map((selected) => {
                const item = getOrderItem(selected.orderItemId);
                const reason = RETURN_REASONS.find((r) => r.value === selected.reason);
                return (
                  <View key={selected.orderItemId} style={{ marginTop: theme.spacing.sm }}>
                    <Text style={styles.reviewValue}>
                      {item?.productName} x{selected.quantity}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                      Reason: {reason?.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Resolution</Text>
              <Text style={styles.reviewValue}>
                {resolution === 'refund' ? 'Refund to original payment method' : 'Exchange for new item'}
              </Text>
            </View>

            <View style={styles.commentSection}>
              <Text style={styles.sectionTitle}>Additional comments (optional)</Text>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Tell us more about why you're returning..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
              />
            </View>

            <View style={styles.photosSection}>
              <Text style={styles.sectionTitle}>Photos (optional)</Text>
              <View style={styles.photosGrid}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoCard}>
                    <Image source={{ uri: photo }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.photoRemove}
                      onPress={() => handleRemovePhoto(index)}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {photos.length < 5 && (
                  <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                    <Ionicons name="camera-outline" size={24} color={theme.colors.textSecondary} />
                    <Text style={styles.addPhotoText}>Add photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerButtons}>
          {step !== 'items' && (
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleBack}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              !canProceed && styles.primaryButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canProceed || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {step === 'review' ? 'Submit Request' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default RequestReturnScreen;

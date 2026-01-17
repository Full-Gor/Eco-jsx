/**
 * Payment Methods Screen
 * List and manage saved payment methods
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button, Card, Modal } from '../../components/common';
import { useToast } from '../../components/common/Toast';
import { Header } from '../../components/layout';
import { useAuth, SavedPaymentMethod } from '../../contexts/AuthContext';
import { ProfileStackParamList } from '../../navigation/types';

type PaymentMethodsNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'PaymentMethods'>;

const CARD_ICONS: Record<string, string> = {
  visa: 'card',
  mastercard: 'card',
  amex: 'card',
  default: 'card-outline',
};

interface PaymentCardProps {
  method: SavedPaymentMethod;
  onDelete: () => void;
  onSetDefault: () => void;
}

function PaymentCard({ method, onDelete, onSetDefault }: PaymentCardProps) {
  const theme = useTheme();

  const getCardIcon = () => {
    return CARD_ICONS[method.brand?.toLowerCase() || 'default'] || 'card-outline';
  };

  const getCardColor = () => {
    switch (method.brand?.toLowerCase()) {
      case 'visa':
        return '#1A1F71';
      case 'mastercard':
        return '#EB001B';
      case 'amex':
        return '#006FCF';
      default:
        return theme.colors.primary;
    }
  };

  const isExpired = () => {
    if (!method.expiryMonth || !method.expiryYear) return false;
    const now = new Date();
    const expiry = new Date(method.expiryYear, method.expiryMonth - 1);
    return expiry < now;
  };

  return (
    <Card variant="outlined" style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <View style={[styles.cardIconContainer, { backgroundColor: getCardColor() + '15' }]}>
            <Ionicons name={getCardIcon() as keyof typeof Ionicons.glyphMap} size={24} color={getCardColor()} />
          </View>
          <View style={styles.cardDetails}>
            <Text style={[styles.cardBrand, { color: theme.colors.text }]}>
              {method.brand || 'Carte'} •••• {method.last4}
            </Text>
            <Text style={[
              styles.cardExpiry,
              { color: isExpired() ? theme.colors.error : theme.colors.textSecondary }
            ]}>
              {isExpired() ? 'Expirée' : `Expire ${method.expiryMonth}/${method.expiryYear}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      {method.isDefault && (
        <View style={[styles.defaultBadge, { backgroundColor: theme.colors.success + '15' }]}>
          <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
          <Text style={[styles.defaultText, { color: theme.colors.success }]}>
            Par défaut
          </Text>
        </View>
      )}

      {!method.isDefault && (
        <Button
          variant="ghost"
          size="sm"
          onPress={onSetDefault}
          style={{ alignSelf: 'flex-start', marginTop: 12 }}
        >
          Définir par défaut
        </Button>
      )}
    </Card>
  );
}

export function PaymentMethodsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<PaymentMethodsNavigationProp>();
  const { paymentMethods, deletePaymentMethod, setDefaultPaymentMethod } = useAuth();
  const { showToast } = useToast();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<SavedPaymentMethod | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePress = (method: SavedPaymentMethod) => {
    setMethodToDelete(method);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!methodToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deletePaymentMethod(methodToDelete.id);
      if (result.success) {
        showToast('Moyen de paiement supprimé', 'success');
      } else {
        showToast(result.error?.message || 'Erreur', 'error');
      }
    } catch (error) {
      showToast('Une erreur est survenue', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteModalVisible(false);
      setMethodToDelete(null);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      const result = await setDefaultPaymentMethod(methodId);
      if (result.success) {
        showToast('Moyen de paiement par défaut mis à jour', 'success');
      } else {
        showToast(result.error?.message || 'Erreur', 'error');
      }
    } catch (error) {
      showToast('Une erreur est survenue', 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        showBack
        onBackPress={() => navigation.goBack()}
        title="Moyens de paiement"
        rightComponent={
          <TouchableOpacity onPress={() => navigation.navigate('AddPaymentMethod')}>
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Ionicons name="card-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Aucun moyen de paiement
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Ajoutez une carte bancaire pour faciliter vos prochains achats
            </Text>
            <Button
              onPress={() => navigation.navigate('AddPaymentMethod')}
              size="lg"
              style={{ marginTop: 24 }}
            >
              Ajouter une carte
            </Button>
          </View>
        ) : (
          <>
            <View style={[styles.securityNote, { backgroundColor: theme.colors.infoBackground }]}>
              <Ionicons name="shield-checkmark" size={20} color={theme.colors.info} />
              <Text style={[styles.securityText, { color: theme.colors.info }]}>
                Vos données de paiement sont sécurisées et chiffrées
              </Text>
            </View>

            {paymentMethods.map((method) => (
              <PaymentCard
                key={method.id}
                method={method}
                onDelete={() => handleDeletePress(method)}
                onSetDefault={() => handleSetDefault(method.id)}
              />
            ))}

            <Button
              variant="outline"
              onPress={() => navigation.navigate('AddPaymentMethod')}
              fullWidth
              leftIcon={<Ionicons name="add" size={20} color={theme.colors.primary} />}
              style={{ marginTop: 8 }}
            >
              Ajouter une carte
            </Button>
          </>
        )}
      </ScrollView>

      {/* Delete confirmation modal */}
      <Modal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        title="Supprimer la carte"
        size="sm"
      >
        <Text style={[styles.modalText, { color: theme.colors.text }]}>
          Êtes-vous sûr de vouloir supprimer cette carte ?
        </Text>
        {methodToDelete && (
          <View style={[styles.cardPreview, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Ionicons name="card" size={24} color={theme.colors.primary} />
            <Text style={[styles.previewText, { color: theme.colors.text }]}>
              {methodToDelete.brand} •••• {methodToDelete.last4}
            </Text>
          </View>
        )}
        <View style={styles.modalButtons}>
          <Button
            variant="ghost"
            onPress={() => setDeleteModalVisible(false)}
            style={{ flex: 1, marginRight: 8 }}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            onPress={handleDeleteConfirm}
            loading={isDeleting}
            style={{ flex: 1, marginLeft: 8 }}
          >
            Supprimer
          </Button>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  securityText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
  },
  paymentCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: 13,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 12,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  cardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  modalButtons: {
    flexDirection: 'row',
  },
});

export default PaymentMethodsScreen;

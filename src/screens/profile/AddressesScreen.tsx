/**
 * Addresses Screen
 * List and manage saved addresses
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button, Card, Modal } from '../../components/common';
import { useToast } from '../../components/common/Toast';
import { Header } from '../../components/layout';
import { useAuth } from '../../hooks';
import { ProfileStackParamList } from '../../navigation/types';
import { Address } from '../../types/common';

type AddressesNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Addresses'>;

interface AddressCardProps {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  const theme = useTheme();

  return (
    <Card variant="outlined" style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.addressLabelContainer}>
          {address.label && (
            <View style={[styles.labelBadge, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.labelText, { color: theme.colors.primary }]}>
                {address.label}
              </Text>
            </View>
          )}
          {address.isDefault && (
            <View style={[styles.defaultBadge, { backgroundColor: theme.colors.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
              <Text style={[styles.defaultText, { color: theme.colors.success }]}>
                Par défaut
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.addressName, { color: theme.colors.text }]}>
        {address.firstName} {address.lastName}
      </Text>
      {address.company && (
        <Text style={[styles.addressLine, { color: theme.colors.textSecondary }]}>
          {address.company}
        </Text>
      )}
      <Text style={[styles.addressLine, { color: theme.colors.textSecondary }]}>
        {address.street}
      </Text>
      {address.street2 && (
        <Text style={[styles.addressLine, { color: theme.colors.textSecondary }]}>
          {address.street2}
        </Text>
      )}
      <Text style={[styles.addressLine, { color: theme.colors.textSecondary }]}>
        {address.postalCode} {address.city}
        {address.state && `, ${address.state}`}
      </Text>
      <Text style={[styles.addressLine, { color: theme.colors.textSecondary }]}>
        {address.country}
      </Text>
      {address.phone && (
        <Text style={[styles.addressPhone, { color: theme.colors.textSecondary }]}>
          {address.phone}
        </Text>
      )}

      <View style={styles.addressActions}>
        <Button variant="outline" size="sm" onPress={onEdit} style={{ flex: 1, marginRight: 8 }}>
          Modifier
        </Button>
        {!address.isDefault && (
          <Button variant="ghost" size="sm" onPress={onSetDefault} style={{ flex: 1, marginLeft: 8 }}>
            Définir par défaut
          </Button>
        )}
      </View>
    </Card>
  );
}

export function AddressesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AddressesNavigationProp>();
  const { addresses, deleteAddress, setDefaultAddress } = useAuth();
  const { showToast } = useToast();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePress = (address: Address) => {
    setAddressToDelete(address);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!addressToDelete?.id) return;

    setIsDeleting(true);
    try {
      const result = await deleteAddress(addressToDelete.id);
      if (result.success) {
        showToast('Adresse supprimée', 'success');
      } else {
        showToast(result.error?.message || 'Erreur', 'error');
      }
    } catch (error) {
      showToast('Une erreur est survenue', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteModalVisible(false);
      setAddressToDelete(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const result = await setDefaultAddress(addressId);
      if (result.success) {
        showToast('Adresse par défaut mise à jour', 'success');
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
        title="Mes adresses"
        rightComponent={
          <TouchableOpacity onPress={() => navigation.navigate('AddAddress', {})}>
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
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.colors.primary + '15' },
              ]}
            >
              <Ionicons name="location-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              Aucune adresse
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Ajoutez une adresse pour faciliter vos prochaines commandes
            </Text>
            <Button
              onPress={() => navigation.navigate('AddAddress', {})}
              size="lg"
              style={{ marginTop: 24 }}
            >
              Ajouter une adresse
            </Button>
          </View>
        ) : (
          <>
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={() => navigation.navigate('EditAddress', { addressId: address.id! })}
                onDelete={() => handleDeletePress(address)}
                onSetDefault={() => handleSetDefault(address.id!)}
              />
            ))}

            <Button
              variant="outline"
              onPress={() => navigation.navigate('AddAddress', {})}
              fullWidth
              leftIcon={<Ionicons name="add" size={20} color={theme.colors.primary} />}
              style={{ marginTop: 8 }}
            >
              Ajouter une adresse
            </Button>
          </>
        )}
      </ScrollView>

      {/* Delete confirmation modal */}
      <Modal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        title="Supprimer l'adresse"
        size="sm"
      >
        <Text style={[styles.modalText, { color: theme.colors.text }]}>
          Êtes-vous sûr de vouloir supprimer cette adresse ?
        </Text>
        {addressToDelete && (
          <View style={[styles.addressPreview, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.previewName, { color: theme.colors.text }]}>
              {addressToDelete.firstName} {addressToDelete.lastName}
            </Text>
            <Text style={[styles.previewLine, { color: theme.colors.textSecondary }]}>
              {addressToDelete.street}, {addressToDelete.postalCode} {addressToDelete.city}
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
  addressCard: {
    marginBottom: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  addressLabelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  addressPhone: {
    fontSize: 14,
    marginTop: 8,
  },
  addressActions: {
    flexDirection: 'row',
    marginTop: 16,
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
  addressPreview: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewLine: {
    fontSize: 13,
  },
  modalButtons: {
    flexDirection: 'row',
  },
});

export default AddressesScreen;

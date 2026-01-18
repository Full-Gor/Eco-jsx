/**
 * Modal component
 */

import React, { ReactNode } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewStyle,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  DimensionValue,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface ModalProps {
  /** Modal visibility */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal content */
  children: ReactNode;
  /** Modal size */
  size?: ModalSize;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close on backdrop press */
  closeOnBackdrop?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** Footer content */
  footer?: ReactNode;
  /** Animation type */
  animationType?: 'none' | 'slide' | 'fade';
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  style,
  footer,
  animationType = 'fade',
}: ModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const getMaxHeight = (): DimensionValue => {
    switch (size) {
      case 'sm':
        return SCREEN_HEIGHT * 0.3;
      case 'md':
        return SCREEN_HEIGHT * 0.5;
      case 'lg':
        return SCREEN_HEIGHT * 0.75;
      case 'full':
        return '100%';
      default:
        return SCREEN_HEIGHT * 0.5;
    }
  };

  const getWidth = (): DimensionValue => {
    if (size === 'full') {
      return '100%';
    }
    return '90%';
  };

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: size === 'full' ? 0 : theme.borderRadius.xl,
    maxHeight: getMaxHeight(),
    width: getWidth(),
    maxWidth: 500,
    ...theme.shadows.xl,
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={closeOnBackdrop ? onClose : undefined}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback>
              <View style={[containerStyle, size === 'full' && { paddingTop: insets.top }, style]}>
                {/* Header */}
                {(title || showCloseButton) && (
                  <View
                    style={[
                      styles.header,
                      {
                        borderBottomColor: theme.colors.border,
                        paddingHorizontal: theme.spacing.lg,
                        paddingVertical: theme.spacing.md,
                      },
                    ]}
                  >
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                      {title}
                    </Text>
                    {showCloseButton && (
                      <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons
                          name="close"
                          size={24}
                          color={theme.colors.textSecondary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Content */}
                <View
                  style={[
                    styles.content,
                    {
                      paddingHorizontal: theme.spacing.lg,
                      paddingVertical: theme.spacing.lg,
                    },
                  ]}
                >
                  {children}
                </View>

                {/* Footer */}
                {footer && (
                  <View
                    style={[
                      styles.footer,
                      {
                        borderTopColor: theme.colors.border,
                        paddingHorizontal: theme.spacing.lg,
                        paddingVertical: theme.spacing.md,
                        paddingBottom: size === 'full' ? insets.bottom + theme.spacing.md : theme.spacing.md,
                      },
                    ]}
                  >
                    {footer}
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    marginLeft: 16,
  },
  content: {
    flexShrink: 1,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default Modal;

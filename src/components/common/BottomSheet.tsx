/**
 * BottomSheet component
 */

import React, { ReactNode, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type BottomSheetHeight = 'auto' | 'half' | 'full' | number;

export interface BottomSheetProps {
  /** Sheet visibility */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Sheet title */
  title?: string;
  /** Sheet content */
  children: ReactNode;
  /** Sheet height */
  height?: BottomSheetHeight;
  /** Show handle */
  showHandle?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close on backdrop press */
  closeOnBackdrop?: boolean;
  /** Enable drag to close */
  enableDragToClose?: boolean;
  /** Custom style */
  style?: ViewStyle;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  height = 'auto',
  showHandle = true,
  showCloseButton = false,
  closeOnBackdrop = true,
  enableDragToClose = true,
  style,
}: BottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const getHeight = (): number | 'auto' => {
    switch (height) {
      case 'auto':
        return 'auto' as unknown as number;
      case 'half':
        return SCREEN_HEIGHT * 0.5;
      case 'full':
        return SCREEN_HEIGHT - insets.top;
      default:
        return typeof height === 'number' ? height : SCREEN_HEIGHT * 0.5;
    }
  };

  const sheetHeight = getHeight();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enableDragToClose,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return enableDragToClose && gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 5,
          }).start();
        }
      },
    })
  ).current;

  const containerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius['2xl'],
    borderTopRightRadius: theme.borderRadius['2xl'],
    paddingBottom: insets.bottom,
    maxHeight: SCREEN_HEIGHT - insets.top,
    ...(sheetHeight !== 'auto' && { height: sheetHeight as number }),
    ...theme.shadows.xl,
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={closeOnBackdrop ? onClose : undefined}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                backgroundColor: theme.colors.overlay,
                opacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <Animated.View
          style={[
            containerStyle,
            style,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Handle */}
          {showHandle && (
            <View {...panResponder.panHandlers} style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            </View>
          )}

          {/* Header */}
          {(title || showCloseButton) && (
            <View
              style={[
                styles.header,
                {
                  paddingHorizontal: theme.spacing.lg,
                  paddingBottom: theme.spacing.md,
                },
              ]}
            >
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {title}
              </Text>
              {showCloseButton && (
                <TouchableOpacity
                  onPress={onClose}
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
          <View style={[styles.content, { paddingHorizontal: theme.spacing.lg }]}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default BottomSheet;

/**
 * Card component
 */

import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../theme';

export type CardVariant = 'elevated' | 'outlined' | 'filled';

export interface CardProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Card content */
  children: ReactNode;
  /** Card variant */
  variant?: CardVariant;
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Border radius */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Custom style */
  style?: ViewStyle;
  /** Make card pressable */
  pressable?: boolean;
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  radius = 'md',
  style,
  pressable = false,
  onPress,
  ...props
}: CardProps) {
  const theme = useTheme();

  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return theme.spacing.sm;
      case 'md':
        return theme.spacing.md;
      case 'lg':
        return theme.spacing.lg;
      default:
        return theme.spacing.md;
    }
  };

  const getBorderRadius = (): number => {
    switch (radius) {
      case 'none':
        return 0;
      case 'sm':
        return theme.borderRadius.sm;
      case 'md':
        return theme.borderRadius.md;
      case 'lg':
        return theme.borderRadius.lg;
      case 'xl':
        return theme.borderRadius.xl;
      default:
        return theme.borderRadius.md;
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.card,
          ...theme.shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'filled':
        return {
          backgroundColor: theme.colors.surfaceVariant,
        };
      default:
        return {
          backgroundColor: theme.colors.card,
        };
    }
  };

  const cardStyle: ViewStyle = {
    padding: getPadding(),
    borderRadius: getBorderRadius(),
    ...getVariantStyles(),
  };

  if (pressable || onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[cardStyle, style]}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

export default Card;

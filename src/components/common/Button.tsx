/**
 * Button component
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Button text */
  children: string;
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Left icon component */
  leftIcon?: React.ReactNode;
  /** Right icon component */
  rightIcon?: React.ReactNode;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const theme = useTheme();

  const isDisabled = disabled || loading;

  const getBackgroundColor = (): string => {
    if (isDisabled) {
      return theme.colors.surfaceDisabled;
    }
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'outline':
      case 'ghost':
        return 'transparent';
      case 'danger':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (isDisabled) {
      return theme.colors.textDisabled;
    }
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return theme.colors.textInverse;
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.text;
      default:
        return theme.colors.textInverse;
    }
  };

  const getBorderColor = (): string => {
    if (isDisabled) {
      return theme.colors.border;
    }
    switch (variant) {
      case 'outline':
        return theme.colors.primary;
      default:
        return 'transparent';
    }
  };

  const getHeight = (): number => {
    switch (size) {
      case 'sm':
        return theme.sizing.button.sm;
      case 'md':
        return theme.sizing.button.md;
      case 'lg':
        return theme.sizing.button.lg;
      case 'xl':
        return theme.sizing.button.xl;
      default:
        return theme.sizing.button.md;
    }
  };

  const getPadding = (): number => {
    switch (size) {
      case 'sm':
        return theme.spacing.sm;
      case 'md':
        return theme.spacing.md;
      case 'lg':
        return theme.spacing.lg;
      case 'xl':
        return theme.spacing.xl;
      default:
        return theme.spacing.md;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return 12;
      case 'md':
        return 14;
      case 'lg':
        return 16;
      case 'xl':
        return 18;
      default:
        return 14;
    }
  };

  const containerStyle: ViewStyle = {
    height: getHeight(),
    paddingHorizontal: getPadding() * 1.5,
    backgroundColor: getBackgroundColor(),
    borderColor: getBorderColor(),
    borderWidth: variant === 'outline' ? 1.5 : 0,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isDisabled ? 0.6 : 1,
    ...(fullWidth && { width: '100%' }),
  };

  const labelStyle: TextStyle = {
    color: getTextColor(),
    fontSize: getFontSize(),
    fontWeight: '600',
    textAlign: 'center',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isDisabled}
      style={[containerStyle, style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text style={[labelStyle, leftIcon ? { marginLeft: 8 } : undefined, rightIcon ? { marginRight: 8 } : undefined, textStyle]}>
            {children}
          </Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  );
}

export default Button;

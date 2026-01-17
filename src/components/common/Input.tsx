/**
 * Input component
 */

import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends TextInputProps {
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Input size */
  size?: InputSize;
  /** Left icon name */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Right icon name */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  /** On right icon press */
  onRightIconPress?: () => void;
  /** Full width input */
  fullWidth?: boolean;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Input style */
  inputStyle?: TextStyle;
  /** Required field */
  required?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      leftIcon,
      rightIcon,
      onRightIconPress,
      fullWidth = true,
      containerStyle,
      inputStyle,
      required,
      editable = true,
      secureTextEntry,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isPassword = secureTextEntry !== undefined;
    const showPassword = isPassword && isPasswordVisible;

    const getHeight = (): number => {
      switch (size) {
        case 'sm':
          return theme.sizing.input.sm;
        case 'md':
          return theme.sizing.input.md;
        case 'lg':
          return theme.sizing.input.lg;
        default:
          return theme.sizing.input.md;
      }
    };

    const getFontSize = (): number => {
      switch (size) {
        case 'sm':
          return 14;
        case 'md':
          return 16;
        case 'lg':
          return 18;
        default:
          return 16;
      }
    };

    const getBorderColor = (): string => {
      if (error) {
        return theme.colors.error;
      }
      if (isFocused) {
        return theme.colors.inputBorderFocused;
      }
      return theme.colors.inputBorder;
    };

    const inputContainerStyle: ViewStyle = {
      height: getHeight(),
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.inputBackground,
      borderWidth: 1.5,
      borderColor: getBorderColor(),
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      opacity: editable ? 1 : 0.6,
    };

    const textInputStyle: TextStyle = {
      flex: 1,
      fontSize: getFontSize(),
      color: theme.colors.text,
      paddingVertical: 0,
      ...(leftIcon && { marginLeft: theme.spacing.sm }),
      ...(rightIcon || isPassword ? { marginRight: theme.spacing.sm } : {}),
    };

    return (
      <View style={[fullWidth && { width: '100%' }, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: theme.colors.text, marginBottom: theme.spacing.xs }]}>
            {label}
            {required && <Text style={{ color: theme.colors.error }}> *</Text>}
          </Text>
        )}

        <View style={inputContainerStyle}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? theme.colors.primary : theme.colors.textTertiary}
            />
          )}

          <TextInput
            ref={ref}
            style={[textInputStyle, inputStyle]}
            placeholderTextColor={theme.colors.inputPlaceholder}
            editable={editable}
            secureTextEntry={isPassword && !showPassword}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {isPassword && (
            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={theme.colors.textTertiary}
              />
            </TouchableOpacity>
          )}

          {rightIcon && !isPassword && (
            <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress}>
              <Ionicons name={rightIcon} size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {(error || helperText) && (
          <Text
            style={[
              styles.helperText,
              {
                color: error ? theme.colors.error : theme.colors.textSecondary,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {error || helperText}
          </Text>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
  },
});

Input.displayName = 'Input';

export default Input;

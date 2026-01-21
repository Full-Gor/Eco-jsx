/**
 * Neumorphic Components for Auth Screens
 * Pastel Sky Blue Theme
 *
 * PALETTE HARMONIEUSE :
 * - Fond principal : #d4e5f7 (bleu ciel pastel doux)
 * - Ombre claire : #ffffff (blanc pur)
 * - Ombre sombre : #b3c7db (bleu-gris doux)
 * - Accent : #7eb8e2 (bleu plus soutenu pour focus)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
  Platform,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// Neumorphic Pastel Blue Theme Colors
export const neumorphicColors = {
  background: '#d4e5f7',    // Bleu ciel pastel principal
  shadowLight: '#ffffff',    // Blanc pour lumière
  shadowDark: '#b3c7db',     // Bleu-gris pour ombre
  text: '#4a6b8a',           // Bleu-gris foncé pour texte
  textLight: '#6b8fad',      // Bleu-gris moyen pour labels
  accent: '#7eb8e2',         // Bleu plus vif pour accents/focus
  accentDark: '#6aa8d4',     // Bleu accent foncé pour gradient
  error: '#e57373',          // Rouge pastel pour erreurs
  white: '#ffffff',
};

// ==================== NEUMORPHIC INPUT ====================

interface NeumorphicInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export function NeumorphicInput({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}: NeumorphicInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputContainer}>
      {label && (
        <Text style={styles.inputLabel}>{label}</Text>
      )}

      {/* Outer container for inset shadow effect */}
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused,
        error && styles.inputWrapperError,
      ]}>
        {/* Inset shadow using gradient overlays */}
        <LinearGradient
          colors={[neumorphicColors.shadowDark, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={styles.insetShadowTopLeft}
        />
        <LinearGradient
          colors={['transparent', neumorphicColors.shadowLight]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.insetShadowBottomRight}
        />

        {/* Content container */}
        <View style={styles.inputContent}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? neumorphicColors.accent : neumorphicColors.textLight}
              style={styles.leftIcon}
            />
          )}

          <TextInput
            style={[
              styles.textInput,
              leftIcon && { paddingLeft: 0 },
              rightIcon && { paddingRight: 0 },
              style,
            ]}
            placeholderTextColor={neumorphicColors.textLight}
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

          {rightIcon && (
            <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
              <Ionicons
                name={rightIcon}
                size={20}
                color={neumorphicColors.textLight}
              />
            </Pressable>
          )}
        </View>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

// ==================== NEUMORPHIC BUTTON ====================

interface NeumorphicButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  style?: ViewStyle;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function NeumorphicButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  style,
  icon,
}: NeumorphicButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePressIn = () => {
    if (!disabled && !loading) {
      setIsPressed(true);
    }
  };

  const handlePressOut = async () => {
    if (!disabled && !loading) {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setTimeout(() => {
        setIsPressed(false);
        onPress();
      }, 100);
    }
  };

  const buttonHeight = size === 'sm' ? 44 : size === 'lg' ? 56 : 50;
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const isActive = isPressed || isHovered;
  const isDisabled = disabled || loading;

  return (
    <View style={[
      styles.buttonWrapper,
      fullWidth && { width: '100%' },
      style,
    ]}>
      {/* Outer shadows - only when NOT pressed */}
      {!isPressed && !isDisabled && (
        <>
          {/* Light shadow (top-left) */}
          <View style={[
            styles.buttonShadowLight,
            {
              height: buttonHeight,
              borderRadius: 24,
            },
          ]} />
          {/* Dark shadow (bottom-right) */}
          <View style={[
            styles.buttonShadowDark,
            {
              height: buttonHeight,
              borderRadius: 24,
            },
          ]} />
        </>
      )}

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        disabled={isDisabled}
        style={[
          styles.button,
          {
            height: buttonHeight,
            opacity: isDisabled ? 0.6 : 1,
          },
        ]}
      >
        {/* Button background */}
        {isActive && !isDisabled ? (
          <LinearGradient
            colors={[neumorphicColors.accent, neumorphicColors.accentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />
        ) : (
          <View style={[
            StyleSheet.absoluteFill,
            { backgroundColor: neumorphicColors.background, borderRadius: 24 },
          ]} />
        )}

        {/* Inset shadow when pressed */}
        {isPressed && (
          <>
            <LinearGradient
              colors={['rgba(0,0,0,0.2)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 0.5 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            />
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.3)']}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            />
          </>
        )}

        {/* Button content */}
        <View style={styles.buttonContent}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={isActive ? neumorphicColors.white : neumorphicColors.text}
            />
          ) : (
            <>
              {icon && (
                <Ionicons
                  name={icon}
                  size={fontSize + 2}
                  color={isActive ? neumorphicColors.white : neumorphicColors.text}
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={[
                styles.buttonText,
                {
                  fontSize,
                  color: isActive ? neumorphicColors.white : neumorphicColors.text,
                  fontWeight: isActive ? '500' : '400',
                },
              ]}>
                {title}
              </Text>
            </>
          )}
        </View>
      </Pressable>
    </View>
  );
}

// ==================== NEUMORPHIC CARD ====================

interface NeumorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function NeumorphicCard({ children, style }: NeumorphicCardProps) {
  return (
    <View style={[styles.cardWrapper, style]}>
      {/* Light shadow (top-left) */}
      <View style={styles.cardShadowLight} />
      {/* Dark shadow (bottom-right) */}
      <View style={styles.cardShadowDark} />
      {/* Card content */}
      <View style={styles.card}>
        {children}
      </View>
    </View>
  );
}

// ==================== NEUMORPHIC CHECKBOX ====================

interface NeumorphicCheckboxProps {
  checked: boolean;
  onPress: () => void;
  label: React.ReactNode;
  error?: boolean;
  disabled?: boolean;
}

export function NeumorphicCheckbox({
  checked,
  onPress,
  label,
  error,
  disabled = false,
}: NeumorphicCheckboxProps) {
  return (
    <Pressable
      style={styles.checkboxContainer}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[
        styles.checkbox,
        checked && styles.checkboxChecked,
        error && styles.checkboxError,
      ]}>
        {checked && (
          <Ionicons
            name="checkmark"
            size={14}
            color={neumorphicColors.white}
          />
        )}
      </View>
      <View style={styles.checkboxLabelContainer}>
        {typeof label === 'string' ? (
          <Text style={styles.checkboxLabel}>{label}</Text>
        ) : (
          label
        )}
      </View>
    </Pressable>
  );
}

// ==================== NEUMORPHIC SOCIAL BUTTON ====================

interface NeumorphicSocialButtonProps {
  provider: 'google' | 'apple' | 'facebook';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function NeumorphicSocialButton({
  provider,
  onPress,
  loading = false,
  disabled = false,
}: NeumorphicSocialButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const config = {
    google: { icon: 'logo-google' as const, color: '#DB4437', label: 'Google' },
    apple: { icon: 'logo-apple' as const, color: '#000000', label: 'Apple' },
    facebook: { icon: 'logo-facebook' as const, color: '#4267B2', label: 'Facebook' },
  };

  const { icon, color, label } = config[provider];
  const isDisabled = disabled || loading;

  return (
    <View style={styles.socialButtonWrapper}>
      {/* Shadows */}
      {!isPressed && !isDisabled && (
        <>
          <View style={styles.socialShadowLight} />
          <View style={styles.socialShadowDark} />
        </>
      )}

      <Pressable
        onPressIn={() => !isDisabled && setIsPressed(true)}
        onPressOut={() => {
          if (!isDisabled) {
            setIsPressed(false);
            onPress();
          }
        }}
        disabled={isDisabled}
        style={[
          styles.socialButton,
          isPressed && styles.socialButtonPressed,
          { opacity: isDisabled ? 0.6 : 1 },
        ]}
      >
        {isPressed && (
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(255,255,255,0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          />
        )}
        <Ionicons name={icon} size={20} color={color} />
        <Text style={styles.socialButtonText}>
          {loading ? '...' : label}
        </Text>
      </Pressable>
    </View>
  );
}

// ==================== NEUMORPHIC DIVIDER ====================

interface NeumorphicDividerProps {
  text: string;
}

export function NeumorphicDivider({ text }: NeumorphicDividerProps) {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{text}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  // Input styles
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: neumorphicColors.textLight,
    fontWeight: '400',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputWrapper: {
    borderRadius: 24,
    backgroundColor: neumorphicColors.background,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputWrapperFocused: {
    borderColor: neumorphicColors.accent,
  },
  inputWrapperError: {
    borderColor: neumorphicColors.error,
  },
  insetShadowTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  insetShadowBottomRight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
    padding: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: neumorphicColors.text,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    color: neumorphicColors.error,
    marginTop: 6,
    marginLeft: 16,
  },

  // Button styles
  buttonWrapper: {
    position: 'relative',
    marginVertical: 8,
  },
  buttonShadowLight: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: 10,
    backgroundColor: neumorphicColors.shadowLight,
  },
  buttonShadowDark: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: -5,
    backgroundColor: neumorphicColors.shadowDark,
  },
  button: {
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // Card styles
  cardWrapper: {
    position: 'relative',
    padding: 13,
  },
  cardShadowLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 13,
    bottom: 13,
    backgroundColor: neumorphicColors.shadowLight,
    borderRadius: 24,
  },
  cardShadowDark: {
    position: 'absolute',
    top: 13,
    left: 13,
    right: 0,
    bottom: 0,
    backgroundColor: neumorphicColors.shadowDark,
    borderRadius: 24,
  },
  card: {
    backgroundColor: neumorphicColors.background,
    borderRadius: 24,
    padding: 32,
  },

  // Checkbox styles
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: neumorphicColors.background,
    borderWidth: 2,
    borderColor: neumorphicColors.shadowDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: neumorphicColors.accent,
    borderColor: neumorphicColors.accent,
  },
  checkboxError: {
    borderColor: neumorphicColors.error,
  },
  checkboxLabelContainer: {
    flex: 1,
    marginLeft: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    color: neumorphicColors.text,
    lineHeight: 20,
  },

  // Social button styles
  socialButtonWrapper: {
    position: 'relative',
    flex: 1,
    margin: 4,
  },
  socialShadowLight: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: 6,
    bottom: 6,
    backgroundColor: neumorphicColors.shadowLight,
    borderRadius: 16,
  },
  socialShadowDark: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    backgroundColor: neumorphicColors.shadowDark,
    borderRadius: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: neumorphicColors.background,
    borderRadius: 16,
    gap: 8,
  },
  socialButtonPressed: {
    backgroundColor: neumorphicColors.background,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: neumorphicColors.text,
  },

  // Divider styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: neumorphicColors.shadowDark,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: neumorphicColors.textLight,
  },
});

export default {
  NeumorphicInput,
  NeumorphicButton,
  NeumorphicCard,
  NeumorphicCheckbox,
  NeumorphicSocialButton,
  NeumorphicDivider,
  neumorphicColors,
};

/**
 * Neumorphic Components for Auth Screens
 * Pastel Sky Blue Theme - TRUE NEUMORPHISM
 *
 * PALETTE HARMONIEUSE :
 * - Fond principal : #d4e5f7 (bleu ciel pastel doux)
 * - Ombre claire : #ffffff (blanc pur)
 * - Ombre sombre : #b3c7db (bleu-gris doux)
 * - Accent : #7eb8e2 (bleu plus soutenu pour focus)
 *
 * Technique: Shadows = positioned Views with solid background colors (like SplashScreen)
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

// Shadow offset values
const SHADOW_OFFSET_LARGE = 8;
const SHADOW_OFFSET_MEDIUM = 5;
const SHADOW_OFFSET_SMALL = 3;

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

      {/* Input wrapper with inset neumorphic effect */}
      <View style={styles.inputOuterWrapper}>
        {/* Inset light shadow (bottom-right - appears inside) */}
        <View style={styles.inputInsetLight} />
        {/* Inset dark shadow (top-left - appears inside) */}
        <View style={styles.inputInsetDark} />

        {/* Main input container */}
        <View style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
        ]}>
          {/* Inner gradient for depth effect */}
          <LinearGradient
            colors={[
              'rgba(179, 199, 219, 0.35)',
              'transparent',
              'transparent',
              'rgba(255, 255, 255, 0.5)',
            ]}
            locations={[0, 0.25, 0.75, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.inputGradient}
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
      { height: buttonHeight + 20 },
      style,
    ]}>
      {/* Outer shadows - only when NOT pressed */}
      {!isPressed && !isDisabled && (
        <>
          {/* Light shadow (top-left) */}
          <View
            style={[
              styles.buttonShadow,
              {
                height: buttonHeight,
                backgroundColor: neumorphicColors.shadowLight,
                top: 10 - SHADOW_OFFSET_MEDIUM,
                left: -SHADOW_OFFSET_MEDIUM,
                right: SHADOW_OFFSET_MEDIUM,
              },
            ]}
          />
          {/* Dark shadow (bottom-right) */}
          <View
            style={[
              styles.buttonShadow,
              {
                height: buttonHeight,
                backgroundColor: neumorphicColors.shadowDark,
                top: 10 + SHADOW_OFFSET_MEDIUM,
                left: SHADOW_OFFSET_MEDIUM,
                right: -SHADOW_OFFSET_MEDIUM,
              },
            ]}
          />
        </>
      )}

      {/* Inset shadows when pressed */}
      {isPressed && (
        <>
          {/* Inset light (bottom-right) */}
          <View
            style={[
              styles.buttonShadow,
              {
                height: buttonHeight,
                backgroundColor: neumorphicColors.shadowLight,
                top: 10 + SHADOW_OFFSET_SMALL,
                left: SHADOW_OFFSET_SMALL,
                right: -SHADOW_OFFSET_SMALL,
              },
            ]}
          />
          {/* Inset dark (top-left) */}
          <View
            style={[
              styles.buttonShadow,
              {
                height: buttonHeight,
                backgroundColor: neumorphicColors.shadowDark,
                top: 10 - SHADOW_OFFSET_SMALL,
                left: -SHADOW_OFFSET_SMALL,
                right: SHADOW_OFFSET_SMALL,
              },
            ]}
          />
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
            top: 10,
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
          ]}>
            {/* Convex gradient effect */}
            {!isPressed && (
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.5)',
                  'transparent',
                  'rgba(179, 199, 219, 0.3)',
                ]}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
              />
            )}
          </View>
        )}

        {/* Inset gradient when pressed */}
        {isPressed && !isActive && (
          <LinearGradient
            colors={[
              'rgba(179, 199, 219, 0.4)',
              'transparent',
              'rgba(255, 255, 255, 0.3)',
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />
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
                  fontWeight: isActive ? '600' : '400',
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

      {/* Card content with convex gradient */}
      <View style={styles.card}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.35)',
            'transparent',
            'rgba(179, 199, 219, 0.2)',
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        />
        <View style={styles.cardContent}>
          {children}
        </View>
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
      <View style={styles.checkboxWrapper}>
        {/* Shadow layers for unchecked state */}
        {!checked && (
          <>
            {/* Light shadow (top-left) */}
            <View style={styles.checkboxShadowLight} />
            {/* Dark shadow (bottom-right) */}
            <View style={styles.checkboxShadowDark} />
          </>
        )}

        <View style={[
          styles.checkbox,
          checked && styles.checkboxChecked,
          error && styles.checkboxError,
        ]}>
          {checked ? (
            <Ionicons
              name="checkmark"
              size={14}
              color={neumorphicColors.white}
            />
          ) : (
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.4)',
                'transparent',
                'rgba(179, 199, 219, 0.3)',
              ]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 6 }]}
            />
          )}
        </View>
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
      {/* Shadows when not pressed */}
      {!isPressed && !isDisabled && (
        <>
          {/* Light shadow (top-left) */}
          <View style={styles.socialShadowLight} />
          {/* Dark shadow (bottom-right) */}
          <View style={styles.socialShadowDark} />
        </>
      )}

      {/* Inset shadows when pressed */}
      {isPressed && (
        <>
          {/* Inset light (bottom-right) */}
          <View style={styles.socialInsetLight} />
          {/* Inset dark (top-left) */}
          <View style={styles.socialInsetDark} />
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
          { opacity: isDisabled ? 0.6 : 1 },
        ]}
      >
        {/* Convex gradient when not pressed */}
        {!isPressed && (
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0.4)',
              'transparent',
              'rgba(179, 199, 219, 0.2)',
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          />
        )}

        {/* Inset gradient when pressed */}
        {isPressed && (
          <LinearGradient
            colors={[
              'rgba(179, 199, 219, 0.3)',
              'transparent',
              'rgba(255, 255, 255, 0.25)',
            ]}
            locations={[0, 0.5, 1]}
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
      {/* Left line with neumorphic effect */}
      <View style={styles.dividerLineWrapper}>
        <View style={styles.dividerLineShadowLight} />
        <View style={styles.dividerLineShadowDark} />
      </View>

      <Text style={styles.dividerText}>{text}</Text>

      {/* Right line with neumorphic effect */}
      <View style={styles.dividerLineWrapper}>
        <View style={styles.dividerLineShadowLight} />
        <View style={styles.dividerLineShadowDark} />
      </View>
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
  inputOuterWrapper: {
    position: 'relative',
  },
  // Inset shadows for inputs (reversed - dark top-left, light bottom-right)
  inputInsetLight: {
    position: 'absolute',
    top: SHADOW_OFFSET_MEDIUM,
    left: SHADOW_OFFSET_MEDIUM,
    right: -SHADOW_OFFSET_MEDIUM,
    bottom: -SHADOW_OFFSET_MEDIUM,
    borderRadius: 24,
    backgroundColor: neumorphicColors.shadowLight,
  },
  inputInsetDark: {
    position: 'absolute',
    top: -SHADOW_OFFSET_MEDIUM,
    left: -SHADOW_OFFSET_MEDIUM,
    right: SHADOW_OFFSET_MEDIUM,
    bottom: SHADOW_OFFSET_MEDIUM,
    borderRadius: 24,
    backgroundColor: neumorphicColors.shadowDark,
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
  inputGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  buttonShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 24,
  },
  button: {
    position: 'absolute',
    left: 0,
    right: 0,
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
    padding: SHADOW_OFFSET_LARGE + 5,
  },
  cardShadowLight: {
    position: 'absolute',
    top: SHADOW_OFFSET_LARGE + 5 - SHADOW_OFFSET_LARGE,
    left: SHADOW_OFFSET_LARGE + 5 - SHADOW_OFFSET_LARGE,
    right: SHADOW_OFFSET_LARGE + 5 + SHADOW_OFFSET_LARGE,
    bottom: SHADOW_OFFSET_LARGE + 5 + SHADOW_OFFSET_LARGE,
    borderRadius: 24,
    backgroundColor: neumorphicColors.shadowLight,
  },
  cardShadowDark: {
    position: 'absolute',
    top: SHADOW_OFFSET_LARGE + 5 + SHADOW_OFFSET_LARGE,
    left: SHADOW_OFFSET_LARGE + 5 + SHADOW_OFFSET_LARGE,
    right: SHADOW_OFFSET_LARGE + 5 - SHADOW_OFFSET_LARGE,
    bottom: SHADOW_OFFSET_LARGE + 5 - SHADOW_OFFSET_LARGE,
    borderRadius: 24,
    backgroundColor: neumorphicColors.shadowDark,
  },
  card: {
    backgroundColor: neumorphicColors.background,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  cardContent: {
    padding: 32,
  },

  // Checkbox styles
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  checkboxWrapper: {
    position: 'relative',
    width: 32,
    height: 32,
    marginTop: -2,
  },
  checkboxShadowLight: {
    position: 'absolute',
    top: 5 - SHADOW_OFFSET_SMALL,
    left: 5 - SHADOW_OFFSET_SMALL,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: neumorphicColors.shadowLight,
  },
  checkboxShadowDark: {
    position: 'absolute',
    top: 5 + SHADOW_OFFSET_SMALL,
    left: 5 + SHADOW_OFFSET_SMALL,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: neumorphicColors.shadowDark,
  },
  checkbox: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: neumorphicColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkboxChecked: {
    backgroundColor: neumorphicColors.accent,
  },
  checkboxError: {
    borderWidth: 2,
    borderColor: neumorphicColors.error,
  },
  checkboxLabelContainer: {
    flex: 1,
    marginLeft: 10,
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
    height: 56,
  },
  socialShadowLight: {
    position: 'absolute',
    top: 6 - SHADOW_OFFSET_SMALL,
    left: 6 - SHADOW_OFFSET_SMALL,
    right: 6 + SHADOW_OFFSET_SMALL,
    bottom: 6 + SHADOW_OFFSET_SMALL,
    borderRadius: 16,
    backgroundColor: neumorphicColors.shadowLight,
  },
  socialShadowDark: {
    position: 'absolute',
    top: 6 + SHADOW_OFFSET_SMALL,
    left: 6 + SHADOW_OFFSET_SMALL,
    right: 6 - SHADOW_OFFSET_SMALL,
    bottom: 6 - SHADOW_OFFSET_SMALL,
    borderRadius: 16,
    backgroundColor: neumorphicColors.shadowDark,
  },
  socialInsetLight: {
    position: 'absolute',
    top: 6 + 2,
    left: 6 + 2,
    right: 6 - 2,
    bottom: 6 - 2,
    borderRadius: 16,
    backgroundColor: neumorphicColors.shadowLight,
  },
  socialInsetDark: {
    position: 'absolute',
    top: 6 - 2,
    left: 6 - 2,
    right: 6 + 2,
    bottom: 6 + 2,
    borderRadius: 16,
    backgroundColor: neumorphicColors.shadowDark,
  },
  socialButton: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: neumorphicColors.background,
    borderRadius: 16,
    gap: 8,
    overflow: 'hidden',
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
    paddingHorizontal: 8,
  },
  dividerLineWrapper: {
    flex: 1,
    height: 4,
    position: 'relative',
  },
  dividerLineShadowLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: neumorphicColors.shadowLight,
  },
  dividerLineShadowDark: {
    position: 'absolute',
    top: 3,
    left: 0,
    right: 0,
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

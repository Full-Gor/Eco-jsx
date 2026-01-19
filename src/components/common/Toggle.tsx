/**
 * Toggle Switch Component
 * 3D style toggle based on provided design with shadows and perspective
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  labelLeft?: string;
  labelRight?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Toggle({
  value,
  onValueChange,
  labelLeft = 'Off',
  labelRight = 'On',
  disabled = false,
  size = 'md',
}: ToggleProps) {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  const sizes = {
    sm: { width: 80, height: 36, fontSize: 11, borderRadius: 10 },
    md: { width: 100, height: 44, fontSize: 13, borderRadius: 12 },
    lg: { width: 120, height: 52, fontSize: 15, borderRadius: 14 },
  };

  const currentSize = sizes[size];

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      friction: 10,
      tension: 60,
    }).start();
  }, [value]);

  const handlePress = async () => {
    if (disabled) return;

    // Haptic feedback
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onValueChange(!value);
  };

  // Interpolations for 3D effect
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-2, 2],
  });

  const rotateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['-12deg', '12deg'],
  });

  const leftLabelOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.35],
  });

  const rightLabelOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  // Shadow opacities
  const leftShadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0.15],
  });

  const rightShadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.8],
  });

  // Left shadow rotation
  const leftShadowRotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-8deg'],
  });

  // Right shadow rotation
  const rightShadowRotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['8deg', '0deg'],
  });

  // Theme colors
  const colors = theme.isDark
    ? {
        outerBg: '#2d3748',
        outerBorderTop: '#1a202c',
        outerBorderBottom: '#4a5568',
        innerBg: '#3d4452',
        innerShadow: '#1a202c',
        optionsBg: '#3d4452',
        optionsBorder: '#4a5568',
        textActive: '#e2e8f0',
        textInactive: '#4a5568',
        textShadowDark: '#1a202c',
        textShadowLight: '#4a5568',
        separator: '#2d3748',
        separatorHighlight: '#4a5568',
        shadowColor: 'rgba(0, 0, 0, 0.9)',
      }
    : {
        outerBg: '#e5e7eb',
        outerBorderTop: '#a1a1aa',
        outerBorderBottom: '#f4f4f5',
        innerBg: '#f3f4f6',
        innerShadow: '#d1d5db',
        optionsBg: '#f3f4f6',
        optionsBorder: '#ffffff',
        textActive: '#1f2937',
        textInactive: '#9ca3af',
        textShadowDark: '#6b7280',
        textShadowLight: '#ffffff',
        separator: '#d1d5db',
        separatorHighlight: '#ffffff',
        shadowColor: 'rgba(0, 0, 0, 0.5)',
      };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.container,
        {
          width: currentSize.width,
          height: currentSize.height,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {/* Outer shell with 3D inset effect */}
      <View
        style={[
          styles.outerShell,
          {
            backgroundColor: colors.outerBg,
            borderRadius: currentSize.borderRadius,
            borderTopColor: colors.outerBorderTop,
            borderBottomColor: colors.outerBorderBottom,
            borderLeftColor: colors.outerBorderTop,
            borderRightColor: colors.outerBorderBottom,
          },
        ]}
      >
        {/* Inner track with inset shadow */}
        <View
          style={[
            styles.innerTrack,
            {
              backgroundColor: colors.innerBg,
              borderRadius: currentSize.borderRadius - 4,
              shadowColor: colors.innerShadow,
            },
          ]}
        >
          {/* Left shadow element */}
          <Animated.View
            style={[
              styles.shadowElement,
              styles.shadowLeft,
              {
                opacity: leftShadowOpacity,
                transform: [{ rotate: leftShadowRotate }],
                backgroundColor: colors.shadowColor,
                borderTopLeftRadius: currentSize.borderRadius - 6,
                borderBottomLeftRadius: currentSize.borderRadius - 6,
              },
            ]}
          />

          {/* Right shadow element */}
          <Animated.View
            style={[
              styles.shadowElement,
              styles.shadowRight,
              {
                opacity: rightShadowOpacity,
                transform: [{ rotate: rightShadowRotate }],
                backgroundColor: colors.shadowColor,
                borderTopRightRadius: currentSize.borderRadius - 6,
                borderBottomRightRadius: currentSize.borderRadius - 6,
              },
            ]}
          />

          {/* Animated options container with 3D transform */}
          <Animated.View
            style={[
              styles.optionsContainer,
              {
                backgroundColor: colors.optionsBg,
                borderRadius: currentSize.borderRadius - 6,
                borderColor: colors.optionsBorder,
                transform: [
                  { translateX },
                  { perspective: 400 },
                  { rotateY },
                ],
              },
            ]}
          >
            {/* Left label */}
            <Animated.Text
              style={[
                styles.label,
                {
                  fontSize: currentSize.fontSize,
                  opacity: leftLabelOpacity,
                  color: colors.textActive,
                  textShadowColor: colors.textShadowLight,
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 0,
                },
              ]}
            >
              {labelLeft}
            </Animated.Text>

            {/* Separator */}
            <View
              style={[
                styles.separator,
                {
                  backgroundColor: colors.separator,
                  shadowColor: colors.separatorHighlight,
                },
              ]}
            />

            {/* Right label */}
            <Animated.Text
              style={[
                styles.label,
                {
                  fontSize: currentSize.fontSize,
                  opacity: rightLabelOpacity,
                  color: colors.textActive,
                  textShadowColor: colors.textShadowLight,
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 0,
                },
              ]}
            >
              {labelRight}
            </Animated.Text>
          </Animated.View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Theme Toggle - Specialized toggle for dark/light mode
 */
interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ isDark, onToggle, size = 'md' }: ThemeToggleProps) {
  return (
    <Toggle
      value={isDark}
      onValueChange={onToggle}
      labelLeft="☀️"
      labelRight="🌙"
      size={size}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerShell: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    padding: 4,
    // 3D inset effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  innerTrack: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    // Inner shadow effect
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  shadowElement: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    width: '45%',
    zIndex: 1,
  },
  shadowLeft: {
    left: 0,
    transformOrigin: 'right center',
  },
  shadowRight: {
    right: 0,
    transformOrigin: 'left center',
  },
  optionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
    borderWidth: 0.5,
    zIndex: 2,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  separator: {
    width: 1,
    height: '50%',
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
});

export default Toggle;

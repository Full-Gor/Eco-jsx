/**
 * Toggle Switch Component
 * 3D style toggle based on provided design
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
    sm: { width: 70, height: 32, fontSize: 10 },
    md: { width: 90, height: 40, fontSize: 12 },
    lg: { width: 110, height: 48, fontSize: 14 },
  };

  const currentSize = sizes[size];

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
  }, [value]);

  const handlePress = async () => {
    if (disabled) return;

    // Haptic feedback
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onValueChange(!value);
  };

  // Interpolations
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-2, 2],
  });

  const rotateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '15deg'],
  });

  const leftOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.4],
  });

  const rightOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const leftShadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 0.2],
  });

  const rightShadowOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.7],
  });

  const bgColor = theme.isDark ? '#3d4452' : '#e5e7eb';
  const innerBgColor = theme.isDark ? '#4a5568' : '#f3f4f6';
  const textColor = theme.isDark ? '#e5e7eb' : '#1f2937';
  const inactiveTextColor = theme.isDark ? '#6b7280' : '#9ca3af';
  const shadowColor = theme.isDark ? '#1a1a2e' : '#6b7280';
  const borderColor = theme.isDark ? '#2d3748' : '#d1d5db';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
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
      {/* Outer shell with 3D effect */}
      <View
        style={[
          styles.outerShell,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
            shadowColor: shadowColor,
          },
        ]}
      >
        {/* Inner track */}
        <View
          style={[
            styles.innerTrack,
            {
              backgroundColor: innerBgColor,
            },
          ]}
        >
          {/* Animated options container */}
          <Animated.View
            style={[
              styles.optionsContainer,
              {
                backgroundColor: innerBgColor,
                transform: [
                  { translateX },
                  { perspective: 300 },
                  { rotateY },
                ],
              },
            ]}
          >
            {/* Left shadow */}
            <Animated.View
              style={[
                styles.shadowLeft,
                {
                  opacity: leftShadowOpacity,
                  backgroundColor: shadowColor,
                },
              ]}
            />

            {/* Right shadow */}
            <Animated.View
              style={[
                styles.shadowRight,
                {
                  opacity: rightShadowOpacity,
                  backgroundColor: shadowColor,
                },
              ]}
            />

            {/* Labels */}
            <Animated.Text
              style={[
                styles.label,
                {
                  fontSize: currentSize.fontSize,
                  color: textColor,
                  opacity: leftOpacity,
                },
              ]}
            >
              {labelLeft}
            </Animated.Text>

            <View style={[styles.separator, { backgroundColor: borderColor }]} />

            <Animated.Text
              style={[
                styles.label,
                {
                  fontSize: currentSize.fontSize,
                  color: textColor,
                  opacity: rightOpacity,
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
      labelLeft="Clair"
      labelRight="Sombre"
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
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  innerTrack: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
    borderRadius: 8,
  },
  shadowLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '40%',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    opacity: 0.3,
  },
  shadowRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '40%',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    opacity: 0.3,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  separator: {
    width: 1,
    height: '50%',
  },
});

export default Toggle;

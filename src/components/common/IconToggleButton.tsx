/**
 * Icon Toggle Button Component
 * True Neumorphic 3D style button using react-native-shadow-2
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Shadow } from 'react-native-shadow-2';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface IconToggleButtonProps {
  iconLeft: IconName;
  iconRight: IconName;
  value: boolean;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function IconToggleButton({
  iconLeft,
  iconRight,
  value,
  onPress,
  size = 'md',
  disabled = false,
}: IconToggleButtonProps) {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  const sizes = {
    sm: { width: 70, height: 34, iconSize: 16, borderRadius: 10 },
    md: { width: 85, height: 42, iconSize: 18, borderRadius: 12 },
    lg: { width: 100, height: 50, iconSize: 22, borderRadius: 14 },
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

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress();
  };

  // Interpolations for 3D effect - more pronounced
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 4],
  });

  const rotateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['-18deg', '18deg'],
  });

  const leftIconOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.3],
  });

  const rightIconOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  // Theme colors for neumorphism
  const colors = theme.isDark
    ? {
        background: '#3d4452',
        shadowLight: '#4a5568',
        shadowDark: '#2d3748',
        innerBg: '#3d4452',
        iconActive: '#f6e05e',
        iconInactive: '#4a5568',
        separator: '#2d3748',
      }
    : {
        background: '#e0e0e0',
        shadowLight: '#ffffff',
        shadowDark: '#bebebe',
        innerBg: '#e0e0e0',
        iconActive: '#f59e0b',
        iconInactive: '#9ca3af',
        separator: '#d1d5db',
      };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.container,
        {
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {/* Dual shadow wrapper for neumorphic effect */}
      <Shadow
        distance={8}
        startColor={colors.shadowDark}
        endColor="transparent"
        offset={[4, 4]}
        style={{ borderRadius: currentSize.borderRadius }}
      >
        <Shadow
          distance={8}
          startColor={colors.shadowLight}
          endColor="transparent"
          offset={[-4, -4]}
          style={{ borderRadius: currentSize.borderRadius }}
        >
          <View
            style={[
              styles.outerShell,
              {
                width: currentSize.width,
                height: currentSize.height,
                backgroundColor: colors.background,
                borderRadius: currentSize.borderRadius,
              },
            ]}
          >
            <View
              style={[
                styles.innerTrack,
                {
                  backgroundColor: colors.innerBg,
                  borderRadius: currentSize.borderRadius - 4,
                  // Inset effect with borders
                  borderWidth: 1,
                  borderTopColor: colors.shadowDark,
                  borderLeftColor: colors.shadowDark,
                  borderBottomColor: colors.shadowLight,
                  borderRightColor: colors.shadowLight,
                },
              ]}
            >
              {/* Options container with 3D transform */}
              <Animated.View
                style={[
                  styles.optionsContainer,
                  {
                    backgroundColor: colors.innerBg,
                    borderRadius: currentSize.borderRadius - 6,
                    transform: [
                      { translateX },
                      { perspective: 250 },
                      { rotateY },
                    ],
                  },
                ]}
              >
                {/* Left icon */}
                <Animated.View style={[styles.iconWrapper, { opacity: leftIconOpacity }]}>
                  <Ionicons
                    name={iconLeft}
                    size={currentSize.iconSize}
                    color={value ? colors.iconInactive : colors.iconActive}
                  />
                </Animated.View>

                {/* Separator */}
                <View
                  style={[
                    styles.separator,
                    {
                      backgroundColor: colors.separator,
                    },
                  ]}
                />

                {/* Right icon */}
                <Animated.View style={[styles.iconWrapper, { opacity: rightIconOpacity }]}>
                  <Ionicons
                    name={iconRight}
                    size={currentSize.iconSize}
                    color={value ? colors.iconActive : colors.iconInactive}
                  />
                </Animated.View>
              </Animated.View>
            </View>
          </View>
        </Shadow>
      </Shadow>
    </TouchableOpacity>
  );
}

/**
 * Navigation Button - Neumorphic style button for navigation items
 */
interface NavButtonProps {
  icon: IconName;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function NavButton({
  icon,
  onPress,
  size = 'md',
  disabled = false,
}: NavButtonProps) {
  const theme = useTheme();

  const sizes = {
    sm: { width: 44, height: 34, iconSize: 18, borderRadius: 10 },
    md: { width: 52, height: 42, iconSize: 20, borderRadius: 12 },
    lg: { width: 60, height: 50, iconSize: 24, borderRadius: 14 },
  };

  const currentSize = sizes[size];

  const handlePress = async () => {
    if (disabled) return;

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress();
  };

  const colors = theme.isDark
    ? {
        background: '#3d4452',
        shadowLight: '#4a5568',
        shadowDark: '#2d3748',
        icon: '#e2e8f0',
      }
    : {
        background: '#e0e0e0',
        shadowLight: '#ffffff',
        shadowDark: '#bebebe',
        icon: '#374151',
      };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.container,
        {
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Shadow
        distance={6}
        startColor={colors.shadowDark}
        endColor="transparent"
        offset={[3, 3]}
        style={{ borderRadius: currentSize.borderRadius }}
      >
        <Shadow
          distance={6}
          startColor={colors.shadowLight}
          endColor="transparent"
          offset={[-3, -3]}
          style={{ borderRadius: currentSize.borderRadius }}
        >
          <View
            style={[
              styles.navButton,
              {
                width: currentSize.width,
                height: currentSize.height,
                backgroundColor: colors.background,
                borderRadius: currentSize.borderRadius,
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={currentSize.iconSize}
              color={colors.icon}
            />
          </View>
        </Shadow>
      </Shadow>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerShell: {
    padding: 4,
  },
  innerTrack: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
  },
  iconWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    width: 1,
    height: '50%',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IconToggleButton;

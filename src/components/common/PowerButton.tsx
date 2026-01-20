/**
 * Power Button Component
 * Neumorphic style power button for logout
 * Uses LinearGradient to simulate CSS inset box-shadow
 */

import React, { useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface PowerButtonProps {
  onPress: () => void;
  size?: number;
  disabled?: boolean;
}

export function PowerButton({
  onPress,
  size = 100,
  disabled = false,
}: PowerButtonProps) {
  const theme = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    setTimeout(() => {
      setIsPressed(false);
      onPress();
    }, 150);
  };

  // Neumorphic colors
  const colors = theme.isDark
    ? {
        background: '#3d4452',
        lightShadow: '#4a5568',
        darkShadow: '#2d3748',
        gradientLight: 'rgba(255, 255, 255, 0.1)',
        gradientDark: 'rgba(0, 0, 0, 0.3)',
        iconOff: '#cc0000',
        iconOn: '#00cc44',
      }
    : {
        background: '#cecece',
        lightShadow: '#ffffff',
        darkShadow: '#a3a3a3',
        gradientLight: 'rgba(255, 255, 255, 0.8)',
        gradientDark: 'rgba(70, 70, 70, 0.2)',
        iconOff: '#cc0000',
        iconOn: '#009933',
      };

  const borderWidth = size * 0.06;
  const iconSize = size * 0.4;
  const innerSize = size - borderWidth * 2;

  return (
    <View style={[styles.wrapper, { width: size + 20, height: size + 20 }]}>
      {/* Outer shadows - only when NOT pressed */}
      {!isPressed && (
        <>
          {/* Light shadow (top-left) */}
          <View
            style={[
              styles.outerShadowLight,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: colors.lightShadow,
                top: 0,
                left: 0,
              },
            ]}
          />
          {/* Dark shadow (bottom-right) */}
          <View
            style={[
              styles.outerShadowDark,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: colors.darkShadow,
                top: 20,
                left: 20,
              },
            ]}
          />
        </>
      )}

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.background,
            borderWidth: borderWidth,
            borderColor: colors.background,
            top: 10,
            left: 10,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {/* Inset effect when pressed - using gradients */}
        {isPressed ? (
          <View style={[styles.innerContainer, { borderRadius: innerSize / 2 }]}>
            {/* Top-left dark gradient (inset shadow) */}
            <LinearGradient
              colors={[colors.gradientDark, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.7, y: 0.7 }}
              style={[
                styles.insetGradient,
                {
                  width: innerSize,
                  height: innerSize,
                  borderRadius: innerSize / 2,
                },
              ]}
            />
            {/* Bottom-right light gradient (inset highlight) */}
            <LinearGradient
              colors={['transparent', colors.gradientLight]}
              start={{ x: 0.3, y: 0.3 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.insetGradient,
                {
                  width: innerSize,
                  height: innerSize,
                  borderRadius: innerSize / 2,
                },
              ]}
            />
            {/* Center fill */}
            <View
              style={[
                styles.centerFill,
                {
                  width: innerSize * 0.7,
                  height: innerSize * 0.7,
                  borderRadius: (innerSize * 0.7) / 2,
                  backgroundColor: colors.background,
                },
              ]}
            />
          </View>
        ) : (
          <View style={[styles.innerContainer, { borderRadius: innerSize / 2 }]}>
            {/* Convex effect - light top-left, dark bottom-right */}
            <LinearGradient
              colors={[colors.gradientLight, 'transparent', colors.gradientDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.convexGradient,
                {
                  width: innerSize,
                  height: innerSize,
                  borderRadius: innerSize / 2,
                },
              ]}
            />
          </View>
        )}

        {/* Power icon */}
        <Ionicons
          name="power"
          size={iconSize}
          color={isPressed ? colors.iconOn : colors.iconOff}
          style={styles.icon}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  outerShadowLight: {
    position: 'absolute',
  },
  outerShadowDark: {
    position: 'absolute',
  },
  button: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insetGradient: {
    position: 'absolute',
  },
  convexGradient: {
    position: 'absolute',
  },
  centerFill: {
    position: 'absolute',
  },
  icon: {
    zIndex: 10,
  },
});

export default PowerButton;

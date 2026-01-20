/**
 * Power Button Component
 * Neumorphic style power button for logout
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
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
  size = 80,
  disabled = false,
}: PowerButtonProps) {
  const theme = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = async () => {
    setIsPressed(false);

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    onPress();
  };

  const colors = theme.isDark
    ? {
        background: '#3d4452',
        shadowLight: 'rgba(255, 255, 255, 0.1)',
        shadowDark: 'rgba(0, 0, 0, 0.4)',
        iconOff: '#ff4444',
        iconOn: '#44ff44',
        border: '#3d4452',
      }
    : {
        background: '#cecece',
        shadowLight: 'rgba(255, 255, 255, 0.5)',
        shadowDark: 'rgba(70, 70, 70, 0.12)',
        iconOff: '#cc0000',
        iconOn: '#009933',
        border: '#cecece',
      };

  const iconSize = size * 0.4;
  const borderWidth = size * 0.05;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.background,
          borderWidth: borderWidth,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
        !isPressed && {
          shadowColor: colors.shadowDark,
          shadowOffset: { width: 10, height: 10 },
          shadowOpacity: 1,
          shadowRadius: 15,
          elevation: 8,
        },
        isPressed && styles.pressed,
      ]}
    >
      {/* Outer highlight shadow (top-left) */}
      {!isPressed && (
        <View
          style={[
            styles.highlightShadow,
            {
              width: size - borderWidth * 2,
              height: size - borderWidth * 2,
              borderRadius: (size - borderWidth * 2) / 2,
              shadowColor: colors.shadowLight,
            },
          ]}
        />
      )}

      {/* Inset effect when pressed */}
      {isPressed && (
        <View
          style={[
            styles.insetShadow,
            {
              width: size - borderWidth * 2 - 10,
              height: size - borderWidth * 2 - 10,
              borderRadius: (size - borderWidth * 2 - 10) / 2,
              backgroundColor: colors.background,
              shadowColor: colors.shadowDark,
            },
          ]}
        />
      )}

      {/* Power icon */}
      <Ionicons
        name="power"
        size={iconSize}
        color={isPressed ? colors.iconOn : colors.iconOff}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  highlightShadow: {
    position: 'absolute',
    shadowOffset: { width: -10, height: -10 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 0,
  },
  insetShadow: {
    position: 'absolute',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 2,
  },
});

export default PowerButton;

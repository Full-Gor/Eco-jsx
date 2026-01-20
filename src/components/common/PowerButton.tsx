/**
 * Power Button Component
 * True Neumorphic style power button using react-native-shadow-2
 * Requires TWO shadows (light + dark) for the 3D effect
 */

import React, { useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Shadow } from 'react-native-shadow-2';
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
        shadowLight: '#4a5568',
        shadowDark: '#2d3748',
        iconOff: '#cc0000',
        iconOn: '#00cc44',
      }
    : {
        background: '#e0e0e0',
        shadowLight: '#ffffff',
        shadowDark: '#bebebe',
        iconOff: '#cc0000',
        iconOn: '#009933',
      };

  const iconSize = size * 0.4;

  // Inset effect simulated with borders
  const insetStyle = {
    borderWidth: 2,
    borderTopColor: colors.shadowDark,
    borderLeftColor: colors.shadowDark,
    borderBottomColor: colors.shadowLight,
    borderRightColor: colors.shadowLight,
  };

  if (isPressed) {
    // INSET state - pressed look with border trick
    return (
      <View style={styles.container}>
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
              opacity: disabled ? 0.5 : 1,
            },
            insetStyle,
          ]}
        >
          <Ionicons
            name="power"
            size={iconSize}
            color={colors.iconOn}
          />
        </Pressable>
      </View>
    );
  }

  // RAISED state - with dual shadows
  return (
    <View style={styles.container}>
      {/* Dark shadow (bottom-right) */}
      <Shadow
        distance={12}
        startColor={colors.shadowDark}
        endColor="transparent"
        offset={[6, 6]}
        style={{ borderRadius: size / 2 }}
      >
        {/* Light shadow (top-left) */}
        <Shadow
          distance={12}
          startColor={colors.shadowLight}
          endColor="transparent"
          offset={[-6, -6]}
          style={{ borderRadius: size / 2 }}
        >
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
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <Ionicons
              name="power"
              size={iconSize}
              color={colors.iconOff}
            />
          </Pressable>
        </Shadow>
      </Shadow>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PowerButton;

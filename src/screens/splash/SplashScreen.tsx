/**
 * Splash Screen with Neumorphic Wave Animation
 * Based on CSS neumorphism with dual shadows
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_WAVE_SIZE = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 2.5;

// Neumorphic colors
const COLORS = {
  base: '#55b9f3',
  lighten: '#62d5ff',
  darken: '#489dcf',
  white: '#c8deeb',
};

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [showWave, setShowWave] = useState(false);

  // Animation values
  const waveSize = useRef(new Animated.Value(40)).current;
  const innerWaveSize = useRef(new Animated.Value(0)).current;
  const waveOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animation after a short delay
    const timer = setTimeout(() => {
      startAnimation();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const startAnimation = () => {
    // Phase 1: Button press (inset effect)
    setIsPressed(true);

    // Phase 2: Start wave after button press
    setTimeout(() => {
      setShowWave(true);

      // Fade in wave
      Animated.timing(waveOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start();

      // Grow outer wave
      Animated.timing(waveSize, {
        toValue: MAX_WAVE_SIZE,
        duration: 3000,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start();

      // Grow inner wave (slightly delayed, creates ring effect)
      Animated.timing(innerWaveSize, {
        toValue: MAX_WAVE_SIZE - 40,
        duration: 3000,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start();

      // Fade out and complete
      setTimeout(() => {
        Animated.timing(waveOpacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }).start(() => {
          onAnimationComplete();
        });
      }, 2500);
    }, 300);
  };

  const buttonSize = 60;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.base} />

      {/* Wave effect */}
      {showWave && (
        <Animated.View
          style={[
            styles.waveContainer,
            {
              width: waveSize,
              height: waveSize,
              opacity: waveOpacity,
            },
          ]}
        >
          {/* Outer wave - neumorphic ring */}
          <Animated.View
            style={[
              styles.waveOuter,
              {
                width: waveSize,
                height: waveSize,
                borderRadius: Animated.divide(waveSize, 2),
              },
            ]}
          >
            {/* Light shadow (top-left) */}
            <View style={[styles.waveShadowLight, { backgroundColor: COLORS.lighten }]} />
            {/* Dark shadow (bottom-right) */}
            <View style={[styles.waveShadowDark, { backgroundColor: COLORS.darken }]} />

            {/* Main wave body with gradient */}
            <LinearGradient
              colors={[COLORS.lighten, COLORS.base, COLORS.darken]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Inner wave - creates the ring effect */}
          <Animated.View
            style={[
              styles.waveInner,
              {
                width: innerWaveSize,
                height: innerWaveSize,
                borderRadius: Animated.divide(innerWaveSize, 2),
                backgroundColor: COLORS.base,
              },
            ]}
          >
            {/* Inset effect using gradient */}
            <LinearGradient
              colors={[COLORS.darken, COLORS.base, COLORS.lighten]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
            />
          </Animated.View>
        </Animated.View>
      )}

      {/* Neumorphic button */}
      <View style={styles.buttonWrapper}>
        {/* Outer shadows - only when NOT pressed */}
        {!isPressed && (
          <>
            {/* Light shadow (top-left) */}
            <View
              style={[
                styles.buttonShadow,
                {
                  width: buttonSize,
                  height: buttonSize,
                  borderRadius: buttonSize / 2,
                  backgroundColor: COLORS.lighten,
                  top: -6,
                  left: -6,
                },
              ]}
            />
            {/* Dark shadow (bottom-right) */}
            <View
              style={[
                styles.buttonShadow,
                {
                  width: buttonSize,
                  height: buttonSize,
                  borderRadius: buttonSize / 2,
                  backgroundColor: COLORS.darken,
                  top: 6,
                  left: 6,
                },
              ]}
            />
          </>
        )}

        {/* Main button */}
        <View
          style={[
            styles.button,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: COLORS.base,
            },
          ]}
        >
          {/* Inset effect when pressed */}
          {isPressed && (
            <LinearGradient
              colors={[COLORS.darken, COLORS.base, COLORS.lighten]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.insetGradient,
                { borderRadius: buttonSize / 2 },
              ]}
            />
          )}

          {/* Convex effect when not pressed */}
          {!isPressed && (
            <LinearGradient
              colors={[COLORS.lighten, COLORS.base, COLORS.darken]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.convexGradient,
                { borderRadius: buttonSize / 2 },
              ]}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.base,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  waveContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveOuter: {
    position: 'absolute',
    overflow: 'hidden',
  },
  waveShadowLight: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: 20,
    bottom: 20,
    opacity: 0.6,
  },
  waveShadowDark: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: -20,
    bottom: -20,
    opacity: 0.6,
  },
  waveInner: {
    position: 'absolute',
    overflow: 'hidden',
  },
  buttonWrapper: {
    position: 'relative',
    zIndex: 10,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonShadow: {
    position: 'absolute',
  },
  button: {
    position: 'absolute',
    overflow: 'hidden',
  },
  insetGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  convexGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
});

export default SplashScreen;

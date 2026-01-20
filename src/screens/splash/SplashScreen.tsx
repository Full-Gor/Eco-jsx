/**
 * Splash Screen with Wave Animation
 * Displays on app launch with a ripple/wave effect
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_WAVE_SIZE = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 2.5;

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  // Animation values
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonShadowOpacity = useRef(new Animated.Value(1)).current;
  const buttonInsetOpacity = useRef(new Animated.Value(0)).current;
  const waveScale = useRef(new Animated.Value(0)).current;
  const waveOpacity = useRef(new Animated.Value(0)).current;
  const innerWaveScale = useRef(new Animated.Value(0)).current;

  // Colors
  const baseColor = '#55b9f3';
  const darkenColor = '#489dcf';
  const lightenColor = '#62d5ff';

  useEffect(() => {
    // Start animation sequence after a short delay
    const timer = setTimeout(() => {
      startAnimation();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const startAnimation = () => {
    // Phase 1: Button press animation (inset effect)
    Animated.parallel([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(buttonShadowOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(buttonInsetOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: Wave expansion
      Animated.parallel([
        // Wave grows
        Animated.timing(waveOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(waveScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        // Inner wave grows slightly delayed
        Animated.sequence([
          Animated.delay(100),
          Animated.timing(innerWaveScale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Phase 3: Fade out and complete
        Animated.timing(waveOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          onAnimationComplete();
        });
      });
    });
  };

  // Interpolate wave size
  const waveSize = waveScale.interpolate({
    inputRange: [0, 1],
    outputRange: [40, MAX_WAVE_SIZE],
  });

  const innerWaveSize = innerWaveScale.interpolate({
    inputRange: [0, 1],
    outputRange: [0, MAX_WAVE_SIZE - 40],
  });

  return (
    <View style={[styles.container, { backgroundColor: baseColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={baseColor} />

      {/* Wave effect */}
      <Animated.View
        style={[
          styles.wave,
          {
            opacity: waveOpacity,
            width: waveSize,
            height: waveSize,
            borderRadius: Animated.divide(waveSize, 2),
            shadowColor: darkenColor,
          },
        ]}
      >
        {/* Inner wave (creates the ring effect) */}
        <Animated.View
          style={[
            styles.innerWave,
            {
              width: innerWaveSize,
              height: innerWaveSize,
              borderRadius: Animated.divide(innerWaveSize, 2),
              backgroundColor: baseColor,
            },
          ]}
        />
      </Animated.View>

      {/* Button with shadow (normal state) */}
      <Animated.View
        style={[
          styles.buttonShadow,
          {
            opacity: buttonShadowOpacity,
            transform: [{ scale: buttonScale }],
            shadowColor: darkenColor,
          },
        ]}
      >
        <View style={[styles.buttonInner, { backgroundColor: baseColor }]} />
      </Animated.View>

      {/* Button with inset effect (pressed state) */}
      <Animated.View
        style={[
          styles.buttonInset,
          {
            opacity: buttonInsetOpacity,
            transform: [{ scale: buttonScale }],
            backgroundColor: baseColor,
          },
        ]}
      >
        <View
          style={[
            styles.buttonInsetInner,
            {
              backgroundColor: darkenColor,
              shadowColor: lightenColor,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 20, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(72, 157, 207, 0.3)',
  },
  innerWave: {
    position: 'absolute',
  },
  buttonShadow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  buttonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  buttonInset: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    zIndex: 10,
    overflow: 'hidden',
  },
  buttonInsetInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    margin: 4,
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 2,
  },
});

export default SplashScreen;

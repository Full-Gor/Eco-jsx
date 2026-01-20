/**
 * Splash Screen with Neumorphic Wave Animation
 * Uses react-native-shadow-2 for true neumorphic dual shadows
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
import { Shadow } from 'react-native-shadow-2';

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

  // Inset effect simulated with borders
  const insetStyle = {
    borderWidth: 3,
    borderTopColor: COLORS.darken,
    borderLeftColor: COLORS.darken,
    borderBottomColor: COLORS.lighten,
    borderRightColor: COLORS.lighten,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.base} />

      {/* Wave effect - using simple neumorphic ring */}
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
          {/* Outer wave ring with neumorphic border */}
          <Animated.View
            style={[
              styles.waveOuter,
              {
                width: waveSize,
                height: waveSize,
                borderRadius: Animated.divide(waveSize, 2),
                backgroundColor: COLORS.base,
                borderWidth: 8,
                borderTopColor: COLORS.lighten,
                borderLeftColor: COLORS.lighten,
                borderBottomColor: COLORS.darken,
                borderRightColor: COLORS.darken,
              },
            ]}
          />

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
          />
        </Animated.View>
      )}

      {/* Neumorphic button with react-native-shadow-2 */}
      <View style={styles.buttonWrapper}>
        {isPressed ? (
          // INSET state - pressed look with border trick
          <View
            style={[
              styles.button,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                backgroundColor: COLORS.base,
              },
              insetStyle,
            ]}
          />
        ) : (
          // RAISED state - with dual shadows
          <Shadow
            distance={10}
            startColor={COLORS.darken}
            endColor="transparent"
            offset={[5, 5]}
            style={{ borderRadius: buttonSize / 2 }}
          >
            <Shadow
              distance={10}
              startColor={COLORS.lighten}
              endColor="transparent"
              offset={[-5, -5]}
              style={{ borderRadius: buttonSize / 2 }}
            >
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
              />
            </Shadow>
          </Shadow>
        )}
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
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SplashScreen;

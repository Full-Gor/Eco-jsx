/**
 * Fortune Wheel Screen
 * Spin to win prizes
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Dimensions,
} from 'react-native';
import { useLoyalty } from '../../contexts/GamificationContext';
import type { WheelPrize, WheelSpinResult } from '../../types/advanced';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width - 80;

interface FortuneWheelScreenProps {
  navigation: {
    goBack: () => void;
  };
}

/**
 * Fortune Wheel Screen Component
 */
export function FortuneWheelScreen({ navigation }: FortuneWheelScreenProps) {
  const { wheelStatus, spinWheel, refreshWheelStatus } = useLoyalty();
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<WheelSpinResult | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    refreshWheelStatus();
  }, []);

  const handleSpin = useCallback(async () => {
    if (!wheelStatus?.canSpin || isSpinning) return;

    setIsSpinning(true);
    setLastResult(null);

    // Start spinning animation
    const spins = 5 + Math.random() * 3; // 5-8 full rotations

    // Get result first to determine where to stop
    const result = await spinWheel();

    if (result) {
      // Find prize index
      const prizeIndex = wheelStatus.prizes.findIndex((p) => p.id === result.prize.id);
      const segmentAngle = 360 / wheelStatus.prizes.length;
      const targetAngle = 360 - (prizeIndex * segmentAngle + segmentAngle / 2);
      const totalRotation = spins * 360 + targetAngle;

      Animated.timing(spinValue, {
        toValue: totalRotation,
        duration: 4000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsSpinning(false);
        setLastResult(result);
        showPrizeAlert(result);
      });
    } else {
      setIsSpinning(false);
      Alert.alert('Error', 'Failed to spin the wheel. Please try again.');
    }
  }, [wheelStatus, isSpinning, spinWheel, spinValue]);

  const showPrizeAlert = (result: WheelSpinResult) => {
    Alert.alert(
      'Congratulations! 🎉',
      `You won: ${result.prize.name}\n\n${result.message}`,
      [{ text: 'Awesome!', onPress: () => refreshWheelStatus() }]
    );
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const renderWheelSegments = () => {
    if (!wheelStatus?.prizes.length) return null;

    const segmentAngle = 360 / wheelStatus.prizes.length;

    return wheelStatus.prizes.map((prize, index) => {
      const rotation = index * segmentAngle;
      return (
        <View
          key={prize.id}
          style={[
            styles.segment,
            {
              backgroundColor: prize.color,
              transform: [
                { rotate: `${rotation}deg` },
                { translateY: -WHEEL_SIZE / 4 },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              { transform: [{ rotate: '90deg' }] },
            ]}
            numberOfLines={2}
          >
            {prize.icon || '🎁'} {prize.name}
          </Text>
        </View>
      );
    });
  };

  if (!wheelStatus) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading wheel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Spin & Win!</Text>
        <Text style={styles.subtitle}>
          {wheelStatus.canSpin
            ? `You have ${wheelStatus.spinsRemaining} spin${wheelStatus.spinsRemaining !== 1 ? 's' : ''} available`
            : wheelStatus.nextFreeSpinAt
            ? `Next free spin: ${new Date(wheelStatus.nextFreeSpinAt).toLocaleTimeString()}`
            : 'Come back tomorrow for a free spin!'}
        </Text>
      </View>

      {/* Wheel */}
      <View style={styles.wheelContainer}>
        {/* Pointer */}
        <View style={styles.pointer}>
          <View style={styles.pointerTriangle} />
        </View>

        {/* Wheel */}
        <Animated.View
          style={[
            styles.wheel,
            { transform: [{ rotate: spin }] },
          ]}
        >
          {renderWheelSegments()}
          <View style={styles.wheelCenter}>
            <Text style={styles.wheelCenterText}>SPIN</Text>
          </View>
        </Animated.View>
      </View>

      {/* Spin Button */}
      <TouchableOpacity
        style={[
          styles.spinButton,
          (!wheelStatus.canSpin || isSpinning) && styles.spinButtonDisabled,
        ]}
        onPress={handleSpin}
        disabled={!wheelStatus.canSpin || isSpinning}
        activeOpacity={0.8}
      >
        <Text style={styles.spinButtonText}>
          {isSpinning ? 'Spinning...' : 'SPIN NOW!'}
        </Text>
      </TouchableOpacity>

      {/* Prizes List */}
      <View style={styles.prizesContainer}>
        <Text style={styles.prizesTitle}>Available Prizes</Text>
        <View style={styles.prizesList}>
          {wheelStatus.prizes.map((prize) => (
            <View key={prize.id} style={styles.prizeItem}>
              <View
                style={[styles.prizeColor, { backgroundColor: prize.color }]}
              />
              <Text style={styles.prizeName}>
                {prize.icon || '🎁'} {prize.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointer: {
    position: 'absolute',
    top: -10,
    zIndex: 10,
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFD700',
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 8,
    borderColor: '#FFD700',
  },
  segment: {
    position: 'absolute',
    width: WHEEL_SIZE / 2 - 20,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    transformOrigin: 'left center',
    left: WHEEL_SIZE / 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  wheelCenter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  wheelCenterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  spinButton: {
    marginTop: 30,
    paddingHorizontal: 60,
    paddingVertical: 16,
    backgroundColor: '#FFD700',
    borderRadius: 30,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  spinButtonDisabled: {
    backgroundColor: '#6c757d',
    shadowOpacity: 0,
  },
  spinButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  prizesContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
    width: '100%',
  },
  prizesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  prizesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  prizeColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  prizeName: {
    fontSize: 12,
    color: '#fff',
  },
});

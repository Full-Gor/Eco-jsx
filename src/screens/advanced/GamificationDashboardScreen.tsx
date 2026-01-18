/**
 * Gamification Dashboard Screen
 * Points, level, missions overview
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useLoyalty } from '../../contexts/GamificationContext';

interface GamificationDashboardScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

/**
 * Gamification Dashboard Screen Component
 */
export function GamificationDashboardScreen({
  navigation,
}: GamificationDashboardScreenProps) {
  const {
    isLoading,
    loyaltyStatus,
    missions,
    refreshStatus,
    refreshMissions,
    dailyCheckin,
    canCheckin,
    conversionRate,
  } = useLoyalty();

  const [canDoCheckin, setCanDoCheckin] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    refreshStatus();
    refreshMissions();
    checkCheckinStatus();
  }, []);

  const checkCheckinStatus = async () => {
    const result = await canCheckin();
    setCanDoCheckin(result);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshStatus(), refreshMissions(), checkCheckinStatus()]);
    setRefreshing(false);
  }, [refreshStatus, refreshMissions]);

  const handleCheckin = async () => {
    const result = await dailyCheckin();
    if (result) {
      setCanDoCheckin(false);
      // Show success message
    }
  };

  const getLevelProgress = () => {
    if (!loyaltyStatus || !loyaltyStatus.nextLevel) return 100;
    const current = loyaltyStatus.points - loyaltyStatus.level.minPoints;
    const total = loyaltyStatus.nextLevel.minPoints - loyaltyStatus.level.minPoints;
    return Math.min(100, (current / total) * 100);
  };

  const getLevelColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return '#CD7F32';
      case 'silver':
        return '#C0C0C0';
      case 'gold':
        return '#FFD700';
      case 'platinum':
        return '#E5E4E2';
      case 'diamond':
        return '#B9F2FF';
      default:
        return '#6c757d';
    }
  };

  const activeMissions = missions.filter((m) => m.status === 'active').slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Points Card */}
      <View style={styles.pointsCard}>
        <View style={styles.pointsHeader}>
          <Text style={styles.pointsLabel}>Your Points</Text>
          {canDoCheckin && (
            <TouchableOpacity style={styles.checkinButton} onPress={handleCheckin}>
              <Text style={styles.checkinButtonText}>Daily Check-in</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.pointsValue}>
          {loyaltyStatus?.points.toLocaleString() || 0}
        </Text>
        <Text style={styles.pointsWorth}>
          Worth ${((loyaltyStatus?.points || 0) / conversionRate).toFixed(2)} in discounts
        </Text>

        {/* Level Progress */}
        {loyaltyStatus && (
          <View style={styles.levelSection}>
            <View style={styles.levelInfo}>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: getLevelColor(loyaltyStatus.level.tier) },
                ]}
              >
                <Text style={styles.levelBadgeText}>
                  {loyaltyStatus.level.name}
                </Text>
              </View>
              {loyaltyStatus.nextLevel && (
                <Text style={styles.nextLevelText}>
                  {loyaltyStatus.pointsToNextLevel} pts to {loyaltyStatus.nextLevel.name}
                </Text>
              )}
            </View>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${getLevelProgress()}%` }]}
              />
            </View>
          </View>
        )}

        {/* Streak */}
        {loyaltyStatus && loyaltyStatus.streakDays > 0 && (
          <View style={styles.streakContainer}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakText}>
              {loyaltyStatus.streakDays} day streak!
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('FortuneWheel')}
        >
          <Text style={styles.quickActionIcon}>🎡</Text>
          <Text style={styles.quickActionText}>Spin & Win</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('Missions')}
        >
          <Text style={styles.quickActionIcon}>🎯</Text>
          <Text style={styles.quickActionText}>Missions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('Referral')}
        >
          <Text style={styles.quickActionIcon}>👥</Text>
          <Text style={styles.quickActionText}>Invite Friends</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('RewardsHistory')}
        >
          <Text style={styles.quickActionIcon}>📜</Text>
          <Text style={styles.quickActionText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Missions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Missions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {activeMissions.map((mission) => (
            <View key={mission.id} style={styles.missionCard}>
              <View style={styles.missionInfo}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionDescription}>{mission.description}</Text>
                <View style={styles.missionProgress}>
                  <View style={styles.missionProgressBar}>
                    <View
                      style={[
                        styles.missionProgressFill,
                        { width: `${(mission.progress / mission.target) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.missionProgressText}>
                    {mission.progress}/{mission.target}
                  </Text>
                </View>
              </View>
              <View style={styles.missionReward}>
                <Text style={styles.missionRewardValue}>
                  +{mission.reward.value}
                </Text>
                <Text style={styles.missionRewardType}>
                  {mission.reward.type === 'points' ? 'pts' : mission.reward.type}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Level Benefits */}
      {loyaltyStatus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Benefits</Text>
          <View style={styles.benefitsCard}>
            {loyaltyStatus.level.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitCheck}>✓</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* How to Earn */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Earn Points</Text>
        <View style={styles.earnCard}>
          <View style={styles.earnItem}>
            <Text style={styles.earnIcon}>🛒</Text>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Shopping</Text>
              <Text style={styles.earnDescription}>
                Earn 10 points per $1 spent
              </Text>
            </View>
          </View>
          <View style={styles.earnItem}>
            <Text style={styles.earnIcon}>⭐</Text>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Reviews</Text>
              <Text style={styles.earnDescription}>
                50 points per product review
              </Text>
            </View>
          </View>
          <View style={styles.earnItem}>
            <Text style={styles.earnIcon}>📅</Text>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Daily Check-in</Text>
              <Text style={styles.earnDescription}>
                10-50 points daily
              </Text>
            </View>
          </View>
          <View style={styles.earnItem}>
            <Text style={styles.earnIcon}>👥</Text>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Referrals</Text>
              <Text style={styles.earnDescription}>
                500 points per friend
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  pointsCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  checkinButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  checkinButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointsWorth: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  levelSection: {
    marginTop: 8,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nextLevelText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  streakIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  streakText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: '#212529',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
  },
  missionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  missionDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  missionProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  missionProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  missionProgressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  missionProgressText: {
    fontSize: 12,
    color: '#6c757d',
    minWidth: 40,
  },
  missionReward: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  missionRewardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  missionRewardType: {
    fontSize: 12,
    color: '#6c757d',
  },
  benefitsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitCheck: {
    fontSize: 16,
    color: '#28a745',
    marginRight: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#212529',
  },
  earnCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  earnIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  earnDescription: {
    fontSize: 12,
    color: '#6c757d',
  },
});

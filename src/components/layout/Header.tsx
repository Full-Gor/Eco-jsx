/**
 * Header component
 */

import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

export interface HeaderProps {
  /** Header title */
  title?: string;
  /** Show back button */
  showBack?: boolean;
  /** Back button press handler */
  onBackPress?: () => void;
  /** Left component */
  leftComponent?: ReactNode;
  /** Right component */
  rightComponent?: ReactNode;
  /** Header variant */
  variant?: 'default' | 'transparent' | 'primary';
  /** Custom style */
  style?: ViewStyle;
  /** Center the title */
  centerTitle?: boolean;
  /** Subtitle */
  subtitle?: string;
}

export function Header({
  title,
  showBack = false,
  onBackPress,
  leftComponent,
  rightComponent,
  variant = 'default',
  style,
  centerTitle = true,
  subtitle,
}: HeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'transparent':
        return 'transparent';
      case 'primary':
        return theme.colors.primary;
      default:
        return theme.colors.background;
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return theme.colors.textInverse;
      default:
        return theme.colors.text;
    }
  };

  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    paddingTop: insets.top,
    borderBottomWidth: variant === 'default' ? StyleSheet.hairlineWidth : 0,
    borderBottomColor: theme.colors.border,
  };

  const contentStyle: ViewStyle = {
    height: theme.sizing.header,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  };

  return (
    <View style={[containerStyle, style]}>
      <StatusBar
        barStyle={variant === 'primary' || theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={getBackgroundColor()}
      />

      <View style={contentStyle}>
        {/* Left section */}
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              onPress={onBackPress}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={getTextColor()}
              />
            </TouchableOpacity>
          )}
          {leftComponent}
        </View>

        {/* Title section */}
        {centerTitle ? (
          <View style={styles.centerSection}>
            {title && (
              <Text
                style={[
                  styles.title,
                  { color: getTextColor() },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  { color: variant === 'primary' ? theme.colors.textInverse : theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.leftTitleSection}>
            {title && (
              <Text
                style={[
                  styles.title,
                  { color: getTextColor() },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  { color: variant === 'primary' ? theme.colors.textInverse : theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        )}

        {/* Right section */}
        <View style={styles.rightSection}>
          {rightComponent}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftTitleSection: {
    flex: 1,
    marginLeft: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 40,
  },
  backButton: {
    marginRight: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default Header;

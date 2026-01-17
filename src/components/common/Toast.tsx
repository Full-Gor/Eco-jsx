/**
 * Toast notification system
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  hideToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

interface ToastItemProps {
  toast: ToastMessage;
  onHide: (id: string) => void;
}

function ToastItem({ toast, onHide }: ToastItemProps) {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          background: theme.colors.successBackground,
          border: theme.colors.success,
          icon: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          background: theme.colors.errorBackground,
          border: theme.colors.error,
          icon: 'close-circle' as const,
        };
      case 'warning':
        return {
          background: theme.colors.warningBackground,
          border: theme.colors.warning,
          icon: 'warning' as const,
        };
      case 'info':
      default:
        return {
          background: theme.colors.infoBackground,
          border: theme.colors.info,
          icon: 'information-circle' as const,
        };
    }
  };

  const colors = getColors();

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide
    const duration = toast.duration || 4000;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide(toast.id);
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, translateY, opacity, onHide]);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.background,
          borderLeftColor: colors.border,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Ionicons name={colors.icon} size={24} color={colors.border} />
      <View style={styles.toastContent}>
        <Text style={[styles.toastTitle, { color: theme.colors.text }]}>
          {toast.title}
        </Text>
        {toast.message && (
          <Text style={[styles.toastMessage, { color: theme.colors.textSecondary }]}>
            {toast.message}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={() => onHide(toast.id)}>
        <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const success = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'success', title, message });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'error', title, message });
    },
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'warning', title, message });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'info', title, message });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast, success, error, warning, info }}>
      {children}
      <View style={[styles.container, { top: insets.top + 10 }]} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onHide={hideToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    width: SCREEN_WIDTH - 32,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  toastContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  toastMessage: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default ToastProvider;

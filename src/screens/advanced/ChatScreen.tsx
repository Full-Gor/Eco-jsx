/**
 * Chat Screen
 * Real-time chat interface
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useChat } from '../../contexts/ChatContext';
import type { ChatMessage, TypingIndicator } from '../../types/advanced';

interface ChatScreenProps {
  route: {
    params: {
      conversationId: string;
    };
  };
  navigation: {
    goBack: () => void;
    setOptions: (options: Record<string, unknown>) => void;
  };
}

/**
 * Chat Screen Component
 */
export function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { conversationId } = route.params;
  const {
    isConnected,
    currentConversation,
    messages,
    typingUsers,
    selectConversation,
    sendMessage,
    markAsRead,
    sendTyping,
    loadMoreMessages,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flatListRef = useRef<FlatList<any>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load conversation on mount
  useEffect(() => {
    selectConversation(conversationId);
  }, [conversationId, selectConversation]);

  // Set navigation title
  useEffect(() => {
    if (currentConversation) {
      navigation.setOptions({
        title:
          currentConversation.title ||
          currentConversation.participants
            .filter((p) => p.type !== 'user')
            .map((p) => p.name)
            .join(', ') ||
          'Chat',
      });
    }
  }, [currentConversation, navigation]);

  // Mark as read when opening
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    const text = inputText.trim();
    setInputText('');

    await sendMessage(text);
    setIsSending(false);

    // Stop typing indicator
    sendTyping(false);
  }, [inputText, isSending, sendMessage, sendTyping]);

  const handleInputChange = useCallback(
    (text: string) => {
      setInputText(text);

      // Send typing indicator
      if (text.length > 0) {
        sendTyping(true);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          sendTyping(false);
        }, 2000);
      } else {
        sendTyping(false);
      }
    },
    [sendTyping]
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: ChatMessage) => {
    return message.senderType === 'user';
  };

  const getStatusIcon = (status: ChatMessage['status']) => {
    switch (status) {
      case 'sending':
        return '◯';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'failed':
        return '✕';
      default:
        return '';
    }
  };

  const renderMessage = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const isOwn = isOwnMessage(item);
      const showAvatar =
        !isOwn &&
        (index === messages.length - 1 ||
          messages[index + 1]?.senderId !== item.senderId);

      return (
        <View
          style={[
            styles.messageContainer,
            isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
          ]}
        >
          {!isOwn && showAvatar && (
            <View style={styles.messageAvatar}>
              <Text style={styles.avatarText}>
                {item.senderName?.charAt(0) || '?'}
              </Text>
            </View>
          )}
          {!isOwn && !showAvatar && <View style={styles.avatarSpacer} />}

          <View
            style={[
              styles.messageBubble,
              isOwn ? styles.ownBubble : styles.otherBubble,
              item.isLocal && styles.localBubble,
            ]}
          >
            {!isOwn && item.senderName && (
              <Text style={styles.senderName}>{item.senderName}</Text>
            )}
            <Text
              style={[
                styles.messageText,
                isOwn ? styles.ownText : styles.otherText,
              ]}
            >
              {item.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  isOwn ? styles.ownTime : styles.otherTime,
                ]}
              >
                {formatTime(item.createdAt)}
              </Text>
              {isOwn && (
                <Text
                  style={[
                    styles.messageStatus,
                    item.status === 'read' && styles.readStatus,
                    item.status === 'failed' && styles.failedStatus,
                  ]}
                >
                  {getStatusIcon(item.status)}
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    },
    [messages]
  );

  const renderTypingIndicator = () => {
    const typing = typingUsers.filter(
      (t) => t.conversationId === conversationId && t.isTyping
    );

    if (typing.length === 0) return null;

    const names = typing.map((t) => t.participantName).join(', ');

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
        <Text style={styles.typingText}>{names} is typing...</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Connection Status */}
      {!isConnected && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionText}>Reconnecting...</Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={[...messages].reverse()}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted
        contentContainerStyle={styles.messagesList}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={renderTypingIndicator}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleInputChange}
          placeholder="Type a message..."
          placeholderTextColor="#6c757d"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isSending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  connectionBanner: {
    backgroundColor: '#ffc107',
    paddingVertical: 6,
    alignItems: 'center',
  },
  connectionText: {
    color: '#212529',
    fontSize: 12,
  },
  messagesList: {
    padding: 16,
    paddingTop: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6c757d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatarSpacer: {
    width: 40,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  localBubble: {
    opacity: 0.7,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#212529',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  ownTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherTime: {
    color: '#6c757d',
  },
  messageStatus: {
    fontSize: 12,
    marginLeft: 4,
    color: 'rgba(255,255,255,0.7)',
  },
  readStatus: {
    color: '#fff',
  },
  failedStatus: {
    color: '#ff6b6b',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6c757d',
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  typingText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    color: '#212529',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  sendButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});

/**
 * Chat Context
 * Real-time customer support chat
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ChatProvider, SendMessageOptions, CreateConversationOptions } from '../providers/chat';
import type {
  ChatMessage,
  Conversation,
  TypingIndicator,
  ChatAttachment,
  ConversationType,
} from '../types/advanced';

/** Chat state */
interface ChatState {
  isConnected: boolean;
  isLoading: boolean;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: ChatMessage[];
  typingUsers: TypingIndicator[];
  unreadCount: number;
  error: string | null;
}

/** Chat context value */
interface ChatContextValue extends ChatState {
  /** Connect to chat service */
  connect: () => Promise<void>;
  /** Disconnect from chat service */
  disconnect: () => Promise<void>;
  /** Fetch all conversations */
  fetchConversations: () => Promise<void>;
  /** Select a conversation */
  selectConversation: (conversationId: string) => Promise<void>;
  /** Create new conversation */
  createConversation: (options: CreateConversationOptions) => Promise<Conversation | null>;
  /** Close conversation */
  closeConversation: (conversationId: string) => Promise<void>;
  /** Send message */
  sendMessage: (content: string, attachments?: Omit<ChatAttachment, 'id'>[]) => Promise<ChatMessage | null>;
  /** Mark current conversation as read */
  markAsRead: () => Promise<void>;
  /** Send typing indicator */
  sendTyping: (isTyping: boolean) => Promise<void>;
  /** Upload attachment */
  uploadAttachment: (file: Blob, type: ChatAttachment['type']) => Promise<ChatAttachment | null>;
  /** Load more messages */
  loadMoreMessages: () => Promise<void>;
  /** Clear current conversation */
  clearCurrentConversation: () => void;
  /** Quick start support chat */
  startSupportChat: (initialMessage?: string) => Promise<Conversation | null>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

/** Chat provider props */
interface ChatProviderComponentProps {
  children: React.ReactNode;
  provider: ChatProvider;
  userId: string | null;
  authToken?: string;
  autoConnect?: boolean;
}

/**
 * Chat Provider Component
 */
export function ChatProviderComponent({
  children,
  provider,
  userId,
  authToken,
  autoConnect = true,
}: ChatProviderComponentProps) {
  const [state, setState] = useState<ChatState>({
    isConnected: false,
    isLoading: false,
    conversations: [],
    currentConversation: null,
    messages: [],
    typingUsers: [],
    unreadCount: 0,
    error: null,
  });

  const initRef = useRef(false);
  const messagesPageRef = useRef(1);

  // Initialize provider
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      await provider.initialize();
    };

    init();

    return () => {
      provider.dispose();
    };
  }, [provider]);

  // Auto-connect when user available
  useEffect(() => {
    if (!userId || !autoConnect) return;

    const connectToChat = async () => {
      await provider.connect(userId, authToken);
    };

    connectToChat();

    // Set up event listeners
    const unsubMessage = provider.onMessage((message) => {
      setState((prev) => {
        // Add message to current conversation if matches
        if (prev.currentConversation?.id === message.conversationId) {
          return {
            ...prev,
            messages: [...prev.messages, message],
          };
        }

        // Update conversation list with new last message
        const updatedConversations = prev.conversations.map((conv) =>
          conv.id === message.conversationId
            ? { ...conv, lastMessage: message, unreadCount: conv.unreadCount + 1 }
            : conv
        );

        return {
          ...prev,
          conversations: updatedConversations,
          unreadCount: prev.unreadCount + 1,
        };
      });
    });

    const unsubTyping = provider.onTyping((indicator) => {
      setState((prev) => {
        if (indicator.isTyping) {
          // Add typing indicator
          const exists = prev.typingUsers.some(
            (t) =>
              t.conversationId === indicator.conversationId &&
              t.participantId === indicator.participantId
          );
          if (exists) return prev;
          return { ...prev, typingUsers: [...prev.typingUsers, indicator] };
        } else {
          // Remove typing indicator
          return {
            ...prev,
            typingUsers: prev.typingUsers.filter(
              (t) =>
                !(
                  t.conversationId === indicator.conversationId &&
                  t.participantId === indicator.participantId
                )
            ),
          };
        }
      });
    });

    const unsubConnection = provider.onConnectionChange((connected) => {
      setState((prev) => ({ ...prev, isConnected: connected }));
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubConnection();
      provider.disconnect();
    };
  }, [provider, userId, authToken, autoConnect]);

  const connect = useCallback(async () => {
    if (!userId) return;
    await provider.connect(userId, authToken);
  }, [provider, userId, authToken]);

  const disconnect = useCallback(async () => {
    await provider.disconnect();
    setState((prev) => ({ ...prev, isConnected: false }));
  }, [provider]);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const result = await provider.getConversations(userId);
      if (result.success && result.data) {
        const conversations = result.data.items;
        const unreadCount = conversations.reduce((sum: number, c: Conversation) => sum + c.unreadCount, 0);
        setState((prev) => ({
          ...prev,
          conversations,
          unreadCount,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message || 'Failed to fetch conversations',
          isLoading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: String(error),
        isLoading: false,
      }));
    }
  }, [provider, userId]);

  const selectConversation = useCallback(
    async (conversationId: string) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      messagesPageRef.current = 1;

      try {
        // Get conversation details
        const convResult = await provider.getConversation(conversationId);
        if (!convResult.success || !convResult.data) {
          throw new Error(convResult.error?.message || 'Failed to get conversation');
        }

        // Get messages
        const msgResult = await provider.getMessages(conversationId, { page: 1, limit: 50 });
        if (!msgResult.success || !msgResult.data) {
          throw new Error(msgResult.error?.message || 'Failed to get messages');
        }

        setState((prev) => ({
          ...prev,
          currentConversation: convResult.data || null,
          messages: msgResult.data?.items || [],
          isLoading: false,
        }));

        // Mark as read
        await provider.markAsRead(conversationId);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: String(error),
          isLoading: false,
        }));
      }
    },
    [provider]
  );

  const createConversation = useCallback(
    async (options: CreateConversationOptions): Promise<Conversation | null> => {
      if (!userId) return null;

      try {
        const result = await provider.createConversation(userId, options);
        if (result.success && result.data) {
          setState((prev) => ({
            ...prev,
            conversations: [result.data!, ...prev.conversations],
            currentConversation: result.data!,
            messages: [],
          }));
          return result.data;
        }
        return null;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return null;
      }
    },
    [provider, userId]
  );

  const closeConversation = useCallback(
    async (conversationId: string) => {
      try {
        await provider.closeConversation(conversationId);
        setState((prev) => ({
          ...prev,
          conversations: prev.conversations.map((c) =>
            c.id === conversationId ? { ...c, status: 'closed' as const } : c
          ),
          currentConversation:
            prev.currentConversation?.id === conversationId
              ? { ...prev.currentConversation, status: 'closed' as const }
              : prev.currentConversation,
        }));
      } catch (error) {
        console.error('Failed to close conversation:', error);
      }
    },
    [provider]
  );

  const sendMessage = useCallback(
    async (
      content: string,
      attachments?: Omit<ChatAttachment, 'id'>[]
    ): Promise<ChatMessage | null> => {
      if (!state.currentConversation) return null;

      try {
        const result = await provider.sendMessage({
          conversationId: state.currentConversation.id,
          content,
          attachments,
        });

        if (result.success && result.data) {
          // Add message to state if not from socket
          if (result.data.isLocal) {
            setState((prev) => ({
              ...prev,
              messages: [...prev.messages, result.data!],
            }));
          }
          return result.data;
        }
        return null;
      } catch (error) {
        console.error('Failed to send message:', error);
        return null;
      }
    },
    [provider, state.currentConversation]
  );

  const markAsRead = useCallback(async () => {
    if (!state.currentConversation) return;

    try {
      await provider.markAsRead(state.currentConversation.id);
      setState((prev) => {
        const readCount = prev.currentConversation?.unreadCount || 0;
        return {
          ...prev,
          unreadCount: Math.max(0, prev.unreadCount - readCount),
          currentConversation: prev.currentConversation
            ? { ...prev.currentConversation, unreadCount: 0 }
            : null,
          conversations: prev.conversations.map((c) =>
            c.id === prev.currentConversation?.id ? { ...c, unreadCount: 0 } : c
          ),
        };
      });
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [provider, state.currentConversation]);

  const sendTyping = useCallback(
    async (isTyping: boolean) => {
      if (!state.currentConversation) return;
      await provider.sendTyping(state.currentConversation.id, isTyping);
    },
    [provider, state.currentConversation]
  );

  const uploadAttachment = useCallback(
    async (file: Blob, type: ChatAttachment['type']): Promise<ChatAttachment | null> => {
      try {
        const result = await provider.uploadAttachment(file, type);
        if (result.success && result.data) {
          return result.data;
        }
        return null;
      } catch (error) {
        console.error('Failed to upload attachment:', error);
        return null;
      }
    },
    [provider]
  );

  const loadMoreMessages = useCallback(async () => {
    if (!state.currentConversation) return;

    messagesPageRef.current += 1;

    try {
      const result = await provider.getMessages(state.currentConversation.id, {
        page: messagesPageRef.current,
        limit: 50,
      });

      if (result.success && result.data) {
        setState((prev) => ({
          ...prev,
          messages: [...(result.data?.items || []), ...prev.messages],
        }));
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  }, [provider, state.currentConversation]);

  const clearCurrentConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentConversation: null,
      messages: [],
      typingUsers: [],
    }));
    messagesPageRef.current = 1;
  }, []);

  const startSupportChat = useCallback(
    async (initialMessage?: string): Promise<Conversation | null> => {
      return createConversation({
        type: 'support',
        title: 'Support Chat',
        initialMessage,
      });
    },
    [createConversation]
  );

  const value: ChatContextValue = {
    ...state,
    connect,
    disconnect,
    fetchConversations,
    selectConversation,
    createConversation,
    closeConversation,
    sendMessage,
    markAsRead,
    sendTyping,
    uploadAttachment,
    loadMoreMessages,
    clearCurrentConversation,
    startSupportChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Hook to use chat
 */
export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}

export { ChatProviderComponent as ChatProvider };

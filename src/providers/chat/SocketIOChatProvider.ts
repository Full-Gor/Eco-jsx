/**
 * Socket.IO Chat Provider
 * Real-time chat using Socket.io
 */

import type { ApiResponse, Pagination, PaginatedResponse } from '../types';
import type {
  ChatProvider,
  ChatProviderConfig,
  SendMessageOptions,
  CreateConversationOptions,
  MessageCallback,
  TypingCallback,
  ConnectionCallback,
} from './ChatProvider.interface';
import type {
  ChatMessage,
  Conversation,
  TypingIndicator,
  ChatAttachment,
} from '../../types/advanced';

/** Socket.IO specific configuration */
export interface SocketIOChatConfig extends ChatProviderConfig {
  /** HTTP API URL */
  apiUrl: string;
  /** WebSocket URL */
  wsUrl: string;
  /** API key for authentication */
  apiKey?: string;
  /** Reconnection settings */
  reconnection?: {
    enabled?: boolean;
    attempts?: number;
    delay?: number;
  };
  /** Enable debug logging */
  debug?: boolean;
}

/** Queued message */
interface QueuedMessage extends SendMessageOptions {
  localId: string;
  queuedAt: string;
}

/**
 * Create Socket.IO chat provider
 */
export function createSocketIOChatProvider(
  config: SocketIOChatConfig
): ChatProvider {
  const {
    apiUrl,
    wsUrl,
    apiKey,
    reconnection = { enabled: true, attempts: 5, delay: 1000 },
    debug = false,
  } = config;

  let isInitialized = false;
  let socket: WebSocket | null = null;
  let currentUserId: string | null = null;
  let connected = false;
  let reconnectAttempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const messageListeners: Set<MessageCallback> = new Set();
  const typingListeners: Set<TypingCallback> = new Set();
  const connectionListeners: Set<ConnectionCallback> = new Set();
  const messageQueue: QueuedMessage[] = [];

  const log = (...args: unknown[]) => {
    if (debug) {
      console.log('[SocketIOChat]', ...args);
    }
  };

  /** Get authorization headers */
  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    return headers;
  };

  /** Make API request */
  const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${apiUrl}/chat${endpoint}`, {
        ...options,
        headers: {
          ...getHeaders(),
          ...((options.headers as Record<string, string>) || {}),
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: 'API_ERROR',
            message: error.message || `HTTP ${response.status}`,
          },
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      log('API error:', error);
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: String(error) },
      };
    }
  };

  /** Generate local message ID */
  const generateLocalId = (): string => {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /** Notify connection listeners */
  const notifyConnectionChange = (isConnected: boolean) => {
    connected = isConnected;
    connectionListeners.forEach((cb) => cb(isConnected));
  };

  /** Handle incoming socket message */
  const handleSocketMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      log('Socket message:', data.type);

      switch (data.type) {
        case 'message':
          messageListeners.forEach((cb) => cb(data.payload as ChatMessage));
          break;
        case 'typing':
          typingListeners.forEach((cb) => cb(data.payload as TypingIndicator));
          break;
        case 'connected':
          notifyConnectionChange(true);
          reconnectAttempts = 0;
          // Sync queued messages on reconnect
          if (messageQueue.length > 0) {
            syncQueuedMessages();
          }
          break;
      }
    } catch (error) {
      log('Error parsing socket message:', error);
    }
  };

  /** Attempt to reconnect */
  const attemptReconnect = () => {
    if (!reconnection.enabled || !currentUserId) return;
    if (reconnectAttempts >= (reconnection.attempts || 5)) {
      log('Max reconnection attempts reached');
      return;
    }

    reconnectAttempts++;
    const delay = (reconnection.delay || 1000) * Math.pow(2, reconnectAttempts - 1);
    log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);

    reconnectTimer = setTimeout(() => {
      if (currentUserId) {
        connectSocket(currentUserId);
      }
    }, delay);
  };

  /** Connect WebSocket */
  const connectSocket = (userId: string): void => {
    if (socket?.readyState === WebSocket.OPEN) return;

    const wsUrlWithAuth = `${wsUrl}?userId=${userId}${apiKey ? `&token=${apiKey}` : ''}`;
    socket = new WebSocket(wsUrlWithAuth);

    socket.onopen = () => {
      log('Socket connected');
      notifyConnectionChange(true);
    };

    socket.onclose = () => {
      log('Socket disconnected');
      notifyConnectionChange(false);
      attemptReconnect();
    };

    socket.onerror = (error) => {
      log('Socket error:', error);
    };

    socket.onmessage = handleSocketMessage;
  };

  /** Sync queued messages */
  const syncQueuedMessages = async (): Promise<void> => {
    const queue = [...messageQueue];
    messageQueue.length = 0;

    for (const msg of queue) {
      const result = await apiRequest<ChatMessage>('/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: msg.conversationId,
          content: msg.content,
          attachments: msg.attachments,
          localId: msg.localId,
        }),
      });

      if (!result.success) {
        // Re-queue failed messages
        messageQueue.push(msg);
      }
    }
  };

  return {
    name: 'socketio-chat',
    type: 'chat',

    async initialize(): Promise<void> {
      if (isInitialized) return;
      log('Initializing Socket.IO chat provider');
      isInitialized = true;
    },

    isReady(): boolean {
      return isInitialized;
    },

    async dispose(): Promise<void> {
      if (socket) {
        socket.close();
        socket = null;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      messageListeners.clear();
      typingListeners.clear();
      connectionListeners.clear();
      isInitialized = false;
      connected = false;
      currentUserId = null;
      log('Provider disposed');
    },

    // ============================================================================
    // Connection
    // ============================================================================

    async connect(userId: string): Promise<ApiResponse<void>> {
      try {
        currentUserId = userId;
        connectSocket(userId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: { code: 'CONNECTION_ERROR', message: String(error) },
        };
      }
    },

    async disconnect(): Promise<void> {
      if (socket) {
        socket.close();
        socket = null;
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      currentUserId = null;
      connected = false;
    },

    isConnected(): boolean {
      return connected;
    },

    // ============================================================================
    // Conversations
    // ============================================================================

    async getConversations(
      userId: string,
      pagination?: Pagination
    ): Promise<ApiResponse<PaginatedResponse<Conversation>>> {
      const params = new URLSearchParams({ userId });
      if (pagination?.page) params.append('page', String(pagination.page));
      if (pagination?.limit) params.append('limit', String(pagination.limit));

      return apiRequest<PaginatedResponse<Conversation>>(
        `/conversations?${params.toString()}`
      );
    },

    async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
      return apiRequest<Conversation>(`/conversations/${conversationId}`);
    },

    async createConversation(
      userId: string,
      options: CreateConversationOptions
    ): Promise<ApiResponse<Conversation>> {
      log('Creating conversation:', options);
      return apiRequest<Conversation>('/conversations', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          type: options.type,
          title: options.title,
          orderId: options.orderId,
          productId: options.productId,
          initialMessage: options.initialMessage,
        }),
      });
    },

    async closeConversation(conversationId: string): Promise<ApiResponse<void>> {
      log('Closing conversation:', conversationId);
      return apiRequest<void>(`/conversations/${conversationId}/close`, {
        method: 'POST',
      });
    },

    // ============================================================================
    // Messages
    // ============================================================================

    async getMessages(
      conversationId: string,
      pagination?: Pagination
    ): Promise<ApiResponse<PaginatedResponse<ChatMessage>>> {
      const params = new URLSearchParams();
      if (pagination?.page) params.append('page', String(pagination.page));
      if (pagination?.limit) params.append('limit', String(pagination.limit));

      return apiRequest<PaginatedResponse<ChatMessage>>(
        `/conversations/${conversationId}/messages?${params.toString()}`
      );
    },

    async sendMessage(options: SendMessageOptions): Promise<ApiResponse<ChatMessage>> {
      log('Sending message:', options.conversationId);

      // If not connected, queue the message
      if (!connected) {
        const localId = generateLocalId();
        messageQueue.push({
          ...options,
          localId,
          queuedAt: new Date().toISOString(),
        });

        // Return optimistic local message
        const localMessage: ChatMessage = {
          id: localId,
          conversationId: options.conversationId,
          senderId: currentUserId || '',
          senderType: 'user',
          content: options.content,
          status: 'sending',
          createdAt: new Date().toISOString(),
          isLocal: true,
        };

        return { success: true, data: localMessage };
      }

      return apiRequest<ChatMessage>('/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: options.conversationId,
          content: options.content,
          attachments: options.attachments,
        }),
      });
    },

    async markAsRead(conversationId: string): Promise<ApiResponse<void>> {
      log('Marking as read:', conversationId);

      // Send via socket for real-time update
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'read',
          conversationId,
        }));
      }

      return apiRequest<void>(`/conversations/${conversationId}/read`, {
        method: 'POST',
      });
    },

    async deleteMessage(messageId: string): Promise<ApiResponse<void>> {
      log('Deleting message:', messageId);
      return apiRequest<void>(`/messages/${messageId}`, {
        method: 'DELETE',
      });
    },

    // ============================================================================
    // Typing Indicator
    // ============================================================================

    async sendTyping(conversationId: string, isTyping: boolean): Promise<void> {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'typing',
          conversationId,
          isTyping,
        }));
      }
    },

    // ============================================================================
    // Offline Queue
    // ============================================================================

    async queueMessage(options: SendMessageOptions): Promise<string> {
      const localId = generateLocalId();
      messageQueue.push({
        ...options,
        localId,
        queuedAt: new Date().toISOString(),
      });
      return localId;
    },

    async getQueuedMessages(): Promise<ChatMessage[]> {
      return messageQueue.map((msg) => ({
        id: msg.localId,
        conversationId: msg.conversationId,
        senderId: currentUserId || '',
        senderType: 'user' as const,
        content: msg.content,
        status: 'sending' as const,
        createdAt: msg.queuedAt,
        isLocal: true,
      }));
    },

    async syncQueue(): Promise<ApiResponse<ChatMessage[]>> {
      if (!connected) {
        return {
          success: false,
          error: { code: 'NOT_CONNECTED', message: 'Not connected to chat' },
        };
      }

      await syncQueuedMessages();
      return { success: true, data: [] };
    },

    // ============================================================================
    // Event Listeners
    // ============================================================================

    onMessage(callback: MessageCallback): () => void {
      messageListeners.add(callback);
      return () => messageListeners.delete(callback);
    },

    onTyping(callback: TypingCallback): () => void {
      typingListeners.add(callback);
      return () => typingListeners.delete(callback);
    },

    onConnectionChange(callback: ConnectionCallback): () => void {
      connectionListeners.add(callback);
      // Immediately notify of current state
      callback(connected);
      return () => connectionListeners.delete(callback);
    },

    // ============================================================================
    // Attachments
    // ============================================================================

    async uploadAttachment(
      file: Blob,
      type: ChatAttachment['type']
    ): Promise<ApiResponse<ChatAttachment>> {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await fetch(`${apiUrl}/chat/attachments`, {
          method: 'POST',
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          return {
            success: false,
            error: {
              code: 'UPLOAD_ERROR',
              message: error.message || `HTTP ${response.status}`,
            },
          };
        }

        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        return {
          success: false,
          error: { code: 'UPLOAD_ERROR', message: String(error) },
        };
      }
    },
  };
}


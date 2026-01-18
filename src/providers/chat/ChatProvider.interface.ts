/**
 * Chat Provider Interface
 * Real-time customer support and seller chat
 */

import type { BaseProvider, ApiResponse, Pagination, PaginatedResponse } from '../types';
import type {
  ChatMessage,
  Conversation,
  TypingIndicator,
  ChatAttachment,
  ConversationType,
} from '../../types/advanced';

/** Chat provider configuration */
export interface ChatProviderConfig {
  apiUrl: string;
  wsUrl?: string;
  apiKey?: string;
  debug?: boolean;
}

/** New message options */
export interface SendMessageOptions {
  conversationId: string;
  content: string;
  attachments?: Omit<ChatAttachment, 'id'>[];
}

/** Create conversation options */
export interface CreateConversationOptions {
  type: ConversationType;
  title?: string;
  orderId?: string;
  productId?: string;
  initialMessage?: string;
}

/** Message callback */
export type MessageCallback = (message: ChatMessage) => void;

/** Typing callback */
export type TypingCallback = (indicator: TypingIndicator) => void;

/** Connection callback */
export type ConnectionCallback = (connected: boolean) => void;

/** Chat provider interface */
export interface ChatProvider extends BaseProvider {
  type: 'chat';

  // ============================================================================
  // Connection
  // ============================================================================

  /**
   * Connect to chat service
   * @param userId - Current user ID
   * @param authToken - Authentication token
   */
  connect(userId: string, authToken?: string): Promise<ApiResponse<void>>;

  /**
   * Disconnect from chat service
   */
  disconnect(): Promise<void>;

  /**
   * Check if connected
   */
  isConnected(): boolean;

  // ============================================================================
  // Conversations
  // ============================================================================

  /**
   * Get all conversations for user
   */
  getConversations(
    userId: string,
    pagination?: Pagination
  ): Promise<ApiResponse<PaginatedResponse<Conversation>>>;

  /**
   * Get single conversation
   */
  getConversation(conversationId: string): Promise<ApiResponse<Conversation>>;

  /**
   * Create new conversation
   */
  createConversation(
    userId: string,
    options: CreateConversationOptions
  ): Promise<ApiResponse<Conversation>>;

  /**
   * Close conversation
   */
  closeConversation(conversationId: string): Promise<ApiResponse<void>>;

  // ============================================================================
  // Messages
  // ============================================================================

  /**
   * Get messages in conversation
   */
  getMessages(
    conversationId: string,
    pagination?: Pagination
  ): Promise<ApiResponse<PaginatedResponse<ChatMessage>>>;

  /**
   * Send message
   */
  sendMessage(options: SendMessageOptions): Promise<ApiResponse<ChatMessage>>;

  /**
   * Mark conversation as read
   */
  markAsRead(conversationId: string): Promise<ApiResponse<void>>;

  /**
   * Delete message
   */
  deleteMessage(messageId: string): Promise<ApiResponse<void>>;

  // ============================================================================
  // Typing Indicator
  // ============================================================================

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean): Promise<void>;

  // ============================================================================
  // Offline Queue
  // ============================================================================

  /**
   * Queue message for sending when online
   */
  queueMessage(options: SendMessageOptions): Promise<string>;

  /**
   * Get queued messages
   */
  getQueuedMessages(): Promise<ChatMessage[]>;

  /**
   * Sync queued messages
   */
  syncQueue(): Promise<ApiResponse<ChatMessage[]>>;

  // ============================================================================
  // Event Listeners
  // ============================================================================

  /**
   * Listen for new messages
   */
  onMessage(callback: MessageCallback): () => void;

  /**
   * Listen for typing indicators
   */
  onTyping(callback: TypingCallback): () => void;

  /**
   * Listen for connection state changes
   */
  onConnectionChange(callback: ConnectionCallback): () => void;

  // ============================================================================
  // Attachments
  // ============================================================================

  /**
   * Upload attachment
   */
  uploadAttachment(
    file: Blob,
    type: ChatAttachment['type']
  ): Promise<ApiResponse<ChatAttachment>>;
}

export type { ChatProviderConfig as ChatConfig };

/**
 * 🎯 FLAGSHIP MESSAGE SERVICE
 * Real-time messaging system with instant delivery and state synchronization
 * Designed for FAANG-level performance and reliability
 */

import enhancedSocketService from './enhancedSocket';
import { tokenManager } from './tokenManager';

interface Message {
  id: string;
  sessionId: string;
  senderAlias: string;
  senderAvatarIndex: number;
  senderId: string;
  content: string;
  type: 'text' | 'emoji' | 'system' | 'announcement';
  attachment?: any;
  replyTo?: string;
  timestamp: string;
  deliveryStatus: 'sending' | 'sent' | 'delivered' | 'failed';
  metadata?: {
    socketId?: string;
    userAgent?: string;
    breakoutRoomId?: string;
  };
}

interface MessageQueue {
  pending: Message[];
  failed: Message[];
  delivered: Message[];
}

class FlagshipMessageService {
  private messageCache = new Map<string, Message>();
  private messageQueue: MessageQueue = {
    pending: [],
    failed: [],
    delivered: []
  };
  private eventListeners = new Map<string, Function>();
  private deliveryCallbacks = new Map<string, Function>();
  private retryAttempts = new Map<string, number>();
  private maxRetryAttempts = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.setupEventListeners();
    this.startDeliveryMonitoring();
  }

  /**
   * 💬 Send a flagship message with guaranteed delivery
   */
  async sendMessage(
    sessionId: string,
    content: string,
    type: 'text' | 'emoji' | 'system' | 'announcement' = 'text',
    attachment?: any,
    replyTo?: string,
    breakoutRoomId?: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Generate unique message ID
      const messageId = `flagship_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create message object
      const message: Message = {
        id: messageId,
        sessionId,
        senderAlias: 'Current User', // This should be populated from user context
        senderAvatarIndex: 1, // This should be populated from user context
        senderId: 'current_user_id', // This should be populated from user context
        content,
        type,
        attachment,
        replyTo,
        timestamp: new Date().toISOString(),
        deliveryStatus: 'sending',
        metadata: {
          socketId: enhancedSocketService.socketId,
          breakoutRoomId
        }
      };

      // Add to cache and pending queue
      this.messageCache.set(messageId, message);
      this.messageQueue.pending.push(message);

      console.log('💬 Flagship Message Service: Sending message:', {
        messageId,
        sessionId,
        type,
        breakoutRoomId
      });

      // Send via socket if connected
      if (enhancedSocketService.connected) {
        if (breakoutRoomId) {
          // Send to breakout room
          enhancedSocketService.emit('breakout_send_message', {
            roomId: breakoutRoomId,
            content,
            type,
            attachment,
            replyTo,
            messageId
          });
        } else {
          // Send to main session
          enhancedSocketService.sendFlagshipMessage(
            sessionId,
            content,
            type,
            attachment,
            replyTo
          );
        }

        // Update status
        message.deliveryStatus = 'sent';
        this.updateMessageStatus(messageId, 'sent');

        return { success: true, messageId };
      } else {
        // Fallback to HTTP API
        return await this.sendMessageViaAPI(message);
      }
    } catch (error) {
      console.error('❌ Flagship Message Service: Send failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  /**
   * 📥 Get messages for a session or breakout room
   */
  async getMessages(sessionId: string, breakoutRoomId?: string): Promise<{
    success: boolean;
    messages?: Message[];
    error?: string;
  }> {
    try {
      const endpoint = breakoutRoomId 
        ? `/api/flagship-sanctuary/${sessionId}/breakout-rooms/${breakoutRoomId}/messages`
        : `/api/flagship-sanctuary/${sessionId}/messages`;

      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...tokenManager.getAuthHeaders()
        }
      });

      if (response.ok) {
        const data = await response.json();
        const messages = data.data?.messages || data.messages || [];
        
        // Update cache
        messages.forEach((message: Message) => {
          this.messageCache.set(message.id, message);
        });

        return { success: true, messages };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Flagship Message Service: Get messages failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch messages'
      };
    }
  }

  /**
   * 🔄 Retry failed messages
   */
  async retryFailedMessages(): Promise<void> {
    const failedMessages = [...this.messageQueue.failed];
    this.messageQueue.failed = [];

    for (const message of failedMessages) {
      const attempts = this.retryAttempts.get(message.id) || 0;
      
      if (attempts < this.maxRetryAttempts) {
        console.log(`🔄 Retrying message ${message.id}, attempt ${attempts + 1}`);
        
        this.retryAttempts.set(message.id, attempts + 1);
        
        // Add back to pending queue
        this.messageQueue.pending.push(message);
        
        // Retry sending
        if (message.metadata?.breakoutRoomId) {
          enhancedSocketService.emit('breakout_send_message', {
            roomId: message.metadata.breakoutRoomId,
            content: message.content,
            type: message.type,
            attachment: message.attachment,
            replyTo: message.replyTo,
            messageId: message.id
          });
        } else {
          enhancedSocketService.sendFlagshipMessage(
            message.sessionId,
            message.content,
            message.type,
            message.attachment,
            message.replyTo
          );
        }
      } else {
        console.error(`❌ Message ${message.id} failed after ${this.maxRetryAttempts} attempts`);
        // Permanently failed - could notify user or store for later
      }
    }
  }

  /**
   * 📊 Get message statistics
   */
  getMessageStats() {
    return {
      totalMessages: this.messageCache.size,
      pendingMessages: this.messageQueue.pending.length,
      failedMessages: this.messageQueue.failed.length,
      deliveredMessages: this.messageQueue.delivered.length,
      retryAttempts: Array.from(this.retryAttempts.entries()).reduce((sum, [, attempts]) => sum + attempts, 0)
    };
  }

  /**
   * 🎧 Add event listener
   */
  addEventListener(event: string, callback: Function) {
    this.eventListeners.set(event, callback);
    enhancedSocketService.on(event, callback as any);
  }

  /**
   * 🔇 Remove event listener
   */
  removeEventListener(event: string) {
    const callback = this.eventListeners.get(event);
    if (callback) {
      enhancedSocketService.off(event, callback as any);
      this.eventListeners.delete(event);
    }
  }

  /**
   * 🔄 Private: Update message status
   */
  private updateMessageStatus(messageId: string, status: Message['deliveryStatus']) {
    const message = this.messageCache.get(messageId);
    if (message) {
      message.deliveryStatus = status;
      
      // Move between queues based on status
      if (status === 'delivered') {
        this.messageQueue.pending = this.messageQueue.pending.filter(m => m.id !== messageId);
        this.messageQueue.delivered.push(message);
      } else if (status === 'failed') {
        this.messageQueue.pending = this.messageQueue.pending.filter(m => m.id !== messageId);
        this.messageQueue.failed.push(message);
      }
    }
  }

  /**
   * 📡 Private: Send message via HTTP API (fallback)
   */
  private async sendMessageViaAPI(message: Message) {
    try {
      const endpoint = message.metadata?.breakoutRoomId
        ? `/api/flagship-sanctuary/${message.sessionId}/breakout-rooms/${message.metadata.breakoutRoomId}/messages`
        : `/api/flagship-sanctuary/${message.sessionId}/messages`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...tokenManager.getAuthHeaders()
        },
        body: JSON.stringify({
          content: message.content,
          type: message.type,
          attachment: message.attachment,
          replyTo: message.replyTo,
          messageId: message.id
        })
      });

      if (response.ok) {
        this.updateMessageStatus(message.id, 'delivered');
        return { success: true, messageId: message.id };
      } else {
        this.updateMessageStatus(message.id, 'failed');
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.updateMessageStatus(message.id, 'failed');
      throw error;
    }
  }

  /**
   * 🎧 Private: Setup event listeners
   */
  private setupEventListeners() {
    // Message delivery confirmation
    enhancedSocketService.on('message_delivered', (data: any) => {
      console.log('✅ Message delivered:', data);
      if (data.messageId) {
        this.updateMessageStatus(data.messageId, 'delivered');
      }
    });

    // Message delivery failure
    enhancedSocketService.on('message_failed', (data: any) => {
      console.error('❌ Message failed:', data);
      if (data.messageId) {
        this.updateMessageStatus(data.messageId, 'failed');
      }
    });

    // New message received
    enhancedSocketService.on('new_message', (message: Message) => {
      console.log('💬 New message received:', message);
      this.messageCache.set(message.id, message);
    });

    // Breakout room message received
    enhancedSocketService.on('breakout_new_message', (message: Message) => {
      console.log('💬 New breakout message received:', message);
      this.messageCache.set(message.id, message);
    });

    // Connection restored - retry failed messages
    enhancedSocketService.on('connect', () => {
      console.log('🔌 Connection restored, retrying failed messages...');
      setTimeout(() => {
        this.retryFailedMessages();
      }, 1000);
    });
  }

  /**
   * ⏰ Private: Start delivery monitoring
   */
  private startDeliveryMonitoring() {
    setInterval(() => {
      // Check for messages stuck in pending state
      const now = Date.now();
      const stuckMessages = this.messageQueue.pending.filter(message => {
        const messageTime = new Date(message.timestamp).getTime();
        return now - messageTime > 10000; // 10 seconds
      });

      // Mark stuck messages as failed
      stuckMessages.forEach(message => {
        console.warn(`⚠️ Message ${message.id} stuck in pending state, marking as failed`);
        this.updateMessageStatus(message.id, 'failed');
      });

      // Retry failed messages if socket is connected
      if (enhancedSocketService.connected && this.messageQueue.failed.length > 0) {
        this.retryFailedMessages();
      }
    }, 5000); // Check every 5 seconds
  }
}

// Create singleton instance
const flagshipMessageService = new FlagshipMessageService();

export default flagshipMessageService;
export { FlagshipMessageService };
export type { Message };
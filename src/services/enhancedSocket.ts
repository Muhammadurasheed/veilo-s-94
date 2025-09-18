/**
 * 🎯 ENHANCED SOCKET SERVICE
 * Flagship-quality real-time communication with deduplication and state management
 */

import { io, Socket } from 'socket.io-client';

interface ParticipantState {
  id: string;
  alias: string;
  avatarIndex: number;
  isHost: boolean;
  isModerator: boolean;
  isMuted: boolean;
  isHandRaised: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  joinedAt: string;
  lastActivity: string;
}

interface SessionState {
  participants: ParticipantState[];
  totalCount: number;
  version: number;
  timestamp: string;
}

interface BreakoutRoom {
  id: string;
  name: string;
  topic?: string;
  description?: string;
  facilitatorId: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: ParticipantState[];
  settings: {
    allowTextChat: boolean;
    allowVoiceChat: boolean;
    allowScreenShare: boolean;
    moderationEnabled: boolean;
    recordingEnabled: boolean;
  };
  isPrivate: boolean;
  requiresApproval: boolean;
  createdAt: string;
  canJoin: boolean;
}

class EnhancedSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventQueue: Array<{ event: string; data: any }> = [];
  private connectionMetrics = {
    connectedAt: null as string | null,
    reconnectCount: 0,
    eventsReceived: 0,
    eventsSent: 0,
    lastActivity: null as string | null
  };

  // State management
  private currentSessionId: string | null = null;
  private currentBreakoutRoomId: string | null = null;
  private sessionState: SessionState | null = null;
  private participantDeduplicationMap = new Map<string, string>(); // participantId -> socketId

  async connect(token?: string): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const serverUrl = import.meta.env.VITE_API_URL || 'https://veilos-backend.onrender.com';
        
        const authToken = token || 
          localStorage.getItem('admin_token') || 
          localStorage.getItem('veilo-auth-token') ||
          localStorage.getItem('token');
        
        console.log('🔌 Enhanced socket connecting:', { 
          hasToken: !!authToken,
          serverUrl,
          reconnectAttempts: this.reconnectAttempts
        });
        
        this.socket = io(serverUrl, {
          auth: { token: authToken },
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          forceNew: false // Reuse existing connection if possible
        });

        this.setupEventHandlers(resolve, reject);

      } catch (error) {
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private setupEventHandlers(resolve: () => void, reject: (error: any) => void): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Enhanced socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionMetrics.connectedAt = new Date().toISOString();
      this.connectionMetrics.reconnectCount++;
      
      this.startHeartbeat();
      this.processEventQueue();
      resolve();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Enhanced socket connection error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        reject(error);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Enhanced socket disconnected:', reason);
      this.isConnected = false;
      this.stopHeartbeat();
      
      // Clear state on disconnect
      this.sessionState = null;
      this.participantDeduplicationMap.clear();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Enhanced socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.startHeartbeat();
    });

    // Enhanced event handlers
    this.setupEnhancedEventHandlers();
  }

  private setupEnhancedEventHandlers(): void {
    if (!this.socket) return;

    // Flagship sanctuary events with deduplication
    this.socket.on('join_confirmed', (data) => {
      console.log('✅ Join confirmed with enhanced data:', data);
      this.sessionState = data.sessionState;
      this.currentSessionId = data.sessionId;
      this.updateConnectionMetrics();
      
      // Update deduplication map
      if (data.participant) {
        this.participantDeduplicationMap.set(data.participant.id, this.socket?.id || '');
      }
    });

    this.socket.on('participant_joined', (data) => {
      console.log('👤 Participant joined (enhanced):', data);
      
      // Prevent duplicate processing
      if (this.isDuplicateParticipantEvent(data.participant?.id)) {
        console.log('⚠️ Duplicate participant join event ignored');
        return;
      }
      
      this.updateSessionState(data.sessionState);
      this.updateConnectionMetrics();
    });

    this.socket.on('participant_left', (data) => {
      console.log('👤 Participant left (enhanced):', data);
      this.updateSessionState(data.sessionState);
      this.updateConnectionMetrics();
    });

    this.socket.on('new_message', (message) => {
      console.log('💬 New message (enhanced):', message);
      this.updateConnectionMetrics();
    });

    // Breakout room events
    this.socket.on('breakout_room_created', (data) => {
      console.log('🏠 Breakout room created:', data);
      this.updateConnectionMetrics();
    });

    this.socket.on('breakout_room_join_success', (data) => {
      console.log('✅ Breakout room joined successfully:', data);
      this.currentBreakoutRoomId = data.room?.id || null;
      this.updateConnectionMetrics();
    });

    this.socket.on('breakout_participant_joined', (data) => {
      console.log('👤 Breakout participant joined:', data);
      this.updateConnectionMetrics();
    });

    // Error handling
    this.socket.on('join_error', (error) => {
      console.error('❌ Join error:', error);
    });

    this.socket.on('breakout_room_create_error', (error) => {
      console.error('❌ Breakout room creation error:', error);
    });

    this.socket.on('breakout_room_join_error', (error) => {
      console.error('❌ Breakout room join error:', error);
    });

    // Heartbeat acknowledgment
    this.socket.on('heartbeat_ack', (data) => {
      this.connectionMetrics.lastActivity = new Date().toISOString();
    });
  }

  private isDuplicateParticipantEvent(participantId?: string): boolean {
    if (!participantId) return false;
    
    const existingSocketId = this.participantDeduplicationMap.get(participantId);
    const currentSocketId = this.socket?.id;
    
    // If participant exists with different socket ID, it might be a duplicate
    return existingSocketId && existingSocketId !== currentSocketId;
  }

  private updateSessionState(newState?: SessionState): void {
    if (newState) {
      this.sessionState = newState;
      
      // Update deduplication map
      newState.participants.forEach(participant => {
        this.participantDeduplicationMap.set(participant.id, this.socket?.id || '');
      });
    }
  }

  private updateConnectionMetrics(): void {
    this.connectionMetrics.eventsReceived++;
    this.connectionMetrics.lastActivity = new Date().toISOString();
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.socket.emit('heartbeat');
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private processEventQueue(): void {
    while (this.eventQueue.length > 0 && this.isConnected) {
      const { event, data } = this.eventQueue.shift()!;
      this.emit(event, data);
    }
  }

  // Public API methods
  
  joinFlagshipSanctuary(sessionId: string, participant: Partial<ParticipantState>): void {
    const eventData = { sessionId, participant };
    
    if (this.isConnected) {
      this.socket?.emit('join_flagship_sanctuary', eventData);
      this.connectionMetrics.eventsSent++;
    } else {
      this.eventQueue.push({ event: 'join_flagship_sanctuary', data: eventData });
    }
  }

  sendFlagshipMessage(sessionId: string, content: string, type = 'text', attachment?: any, replyTo?: string): void {
    const eventData = { sessionId, content, type, attachment, replyTo };
    
    if (this.isConnected) {
      this.socket?.emit('flagship_send_message', eventData);
      this.connectionMetrics.eventsSent++;
    } else {
      this.eventQueue.push({ event: 'flagship_send_message', data: eventData });
    }
  }

  createBreakoutRoom(sessionId: string, roomConfig: any): void {
    const eventData = { sessionId, roomConfig };
    
    if (this.isConnected) {
      this.socket?.emit('create_breakout_room', eventData);
      this.connectionMetrics.eventsSent++;
    } else {
      this.eventQueue.push({ event: 'create_breakout_room', data: eventData });
    }
  }

  joinBreakoutRoom(roomId: string, participantData?: any): void {
    const eventData = { roomId, participantData };
    
    if (this.isConnected) {
      this.socket?.emit('join_breakout_room', eventData);
      this.connectionMetrics.eventsSent++;
    } else {
      this.eventQueue.push({ event: 'join_breakout_room', data: eventData });
    }
  }

  // Event listener management
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  emit(event: string, data?: any): void {
    if (this.isConnected) {
      this.socket?.emit(event, data);
      this.connectionMetrics.eventsSent++;
    } else {
      this.eventQueue.push({ event, data });
    }
  }

  // Getters
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }

  get currentSession(): string | null {
    return this.currentSessionId;
  }

  get currentBreakoutRoom(): string | null {
    return this.currentBreakoutRoomId;
  }

  get metrics() {
    return { ...this.connectionMetrics };
  }

  get state(): SessionState | null {
    return this.sessionState;
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
    this.isConnected = false;
    this.connectionPromise = null;
    this.sessionState = null;
    this.participantDeduplicationMap.clear();
    this.eventQueue = [];
  }
}

// Create singleton instance
const enhancedSocketService = new EnhancedSocketService();

export default enhancedSocketService;
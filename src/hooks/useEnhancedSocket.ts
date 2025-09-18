/**
 * 🎯 ENHANCED SOCKET HOOK
 * React hook for flagship-quality real-time communication
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import enhancedSocketService from '@/services/enhancedSocket';

interface UseEnhancedSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

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

export const useEnhancedSocket = (options: UseEnhancedSocketOptions = {}) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [connectionMetrics, setConnectionMetrics] = useState(enhancedSocketService.metrics);
  
  const isConnecting = useRef(false);
  const eventListeners = useRef<Map<string, Function>>(new Map());

  const connect = useCallback(async () => {
    if (isConnecting.current || enhancedSocketService.connected) {
      return;
    }

    isConnecting.current = true;
    
    try {
      const token = localStorage.getItem('veilo-auth-token') || 
                   localStorage.getItem('admin_token') ||
                   localStorage.getItem('token');
      
      await enhancedSocketService.connect(token);
      
      setIsConnected(true);
      setConnectionMetrics(enhancedSocketService.metrics);
      onConnect?.();
      
      if (user?.loggedIn) {
        toast({
          title: "🚀 Enhanced Connection Active",
          description: "Flagship real-time features are now available",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Enhanced socket connection failed:', error);
      setIsConnected(false);
      onError?.(error);
      
      toast({
        title: "Connection Error",
        description: "Some real-time features may not work properly",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      isConnecting.current = false;
    }
  }, [user, toast, onConnect, onError]);

  const disconnect = useCallback(() => {
    enhancedSocketService.disconnect();
    setIsConnected(false);
    setSessionState(null);
    onDisconnect?.();
  }, [onDisconnect]);

  // Enhanced event listener management
  const addEventListener = useCallback((event: string, callback: Function) => {
    // Remove existing listener if any
    const existingCallback = eventListeners.current.get(event);
    if (existingCallback) {
      enhancedSocketService.off(event, existingCallback as any);
    }
    
    // Add new listener
    enhancedSocketService.on(event, callback as any);
    eventListeners.current.set(event, callback);
  }, []);

  const removeEventListener = useCallback((event: string) => {
    const callback = eventListeners.current.get(event);
    if (callback) {
      enhancedSocketService.off(event, callback as any);
      eventListeners.current.delete(event);
    }
  }, []);

  // Flagship sanctuary methods
  const joinFlagshipSanctuary = useCallback((sessionId: string, participant: Partial<ParticipantState>) => {
    console.log('🎯 Joining flagship sanctuary via enhanced hook:', { sessionId, participant });
    enhancedSocketService.joinFlagshipSanctuary(sessionId, participant);
  }, []);

  const sendFlagshipMessage = useCallback((
    sessionId: string, 
    content: string, 
    type = 'text', 
    attachment?: any, 
    replyTo?: string
  ) => {
    enhancedSocketService.sendFlagshipMessage(sessionId, content, type, attachment, replyTo);
  }, []);

  // Breakout room methods
  const createBreakoutRoom = useCallback((sessionId: string, roomConfig: any) => {
    console.log('🏠 Creating breakout room via enhanced hook:', { sessionId, roomConfig });
    enhancedSocketService.createBreakoutRoom(sessionId, roomConfig);
  }, []);

  const joinBreakoutRoom = useCallback((roomId: string, participantData?: any) => {
    console.log('🚪 Joining breakout room via enhanced hook:', { roomId, participantData });
    enhancedSocketService.joinBreakoutRoom(roomId, participantData);
  }, []);

  // Setup connection and event listeners
  useEffect(() => {
    if (autoConnect && user?.loggedIn && !enhancedSocketService.connected) {
      connect();
    }

    // Setup core event listeners
    const handleJoinConfirmed = (data: any) => {
      console.log('✅ Join confirmed in hook:', data);
      setSessionState(data.sessionState);
      setConnectionMetrics(enhancedSocketService.metrics);
    };

    const handleParticipantJoined = (data: any) => {
      console.log('👤 Participant joined in hook:', data);
      if (data.sessionState) {
        setSessionState(data.sessionState);
      }
      setConnectionMetrics(enhancedSocketService.metrics);
    };

    const handleParticipantLeft = (data: any) => {
      console.log('👤 Participant left in hook:', data);
      if (data.sessionState) {
        setSessionState(data.sessionState);
      }
      setConnectionMetrics(enhancedSocketService.metrics);
    };

    const handleNewMessage = (message: any) => {
      console.log('💬 New message in hook:', message);
      setConnectionMetrics(enhancedSocketService.metrics);
    };

    const handleBreakoutRoomCreated = (data: any) => {
      console.log('🏠 Breakout room created in hook:', data);
      toast({
        title: "Breakout Room Created",
        description: `"${data.room?.name}" is now available`,
        duration: 3000
      });
    };

    const handleBreakoutRoomJoinSuccess = (data: any) => {
      console.log('✅ Breakout room joined in hook:', data);
      toast({
        title: "Joined Breakout Room",
        description: `You're now in "${data.room?.name}"`,
        duration: 3000
      });
    };

    const handleJoinError = (error: any) => {
      console.error('❌ Join error in hook:', error);
      toast({
        title: "Join Failed",
        description: error.message || "Failed to join session",
        variant: "destructive",
        duration: 5000
      });
    };

    const handleBreakoutCreateError = (error: any) => {
      console.error('❌ Breakout creation error in hook:', error);
      toast({
        title: "Room Creation Failed",
        description: error.message || "Failed to create breakout room",
        variant: "destructive",
        duration: 5000
      });
    };

    const handleBreakoutJoinError = (error: any) => {
      console.error('❌ Breakout join error in hook:', error);
      toast({
        title: "Join Room Failed",
        description: error.message || "Failed to join breakout room",
        variant: "destructive",
        duration: 5000
      });
    };

    // Add event listeners
    addEventListener('join_confirmed', handleJoinConfirmed);
    addEventListener('participant_joined', handleParticipantJoined);
    addEventListener('participant_left', handleParticipantLeft);
    addEventListener('new_message', handleNewMessage);
    addEventListener('breakout_room_created', handleBreakoutRoomCreated);
    addEventListener('breakout_room_join_success', handleBreakoutRoomJoinSuccess);
    addEventListener('join_error', handleJoinError);
    addEventListener('breakout_room_create_error', handleBreakoutCreateError);
    addEventListener('breakout_room_join_error', handleBreakoutJoinError);

    return () => {
      // Cleanup event listeners
      eventListeners.current.forEach((_, event) => {
        removeEventListener(event);
      });
    };
  }, [autoConnect, user?.loggedIn, connect, addEventListener, removeEventListener, toast]);

  // Update connection status
  useEffect(() => {
    const checkConnection = () => {
      const connected = enhancedSocketService.connected;
      if (connected !== isConnected) {
        setIsConnected(connected);
      }
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    // Connection management
    connect,
    disconnect,
    isConnected,
    socketId: enhancedSocketService.socketId,
    
    // State
    sessionState,
    connectionMetrics,
    currentSession: enhancedSocketService.currentSession,
    currentBreakoutRoom: enhancedSocketService.currentBreakoutRoom,
    
    // Event management
    addEventListener,
    removeEventListener,
    emit: enhancedSocketService.emit.bind(enhancedSocketService),
    
    // Flagship sanctuary methods
    joinFlagshipSanctuary,
    sendFlagshipMessage,
    
    // Breakout room methods
    createBreakoutRoom,
    joinBreakoutRoom,
    
    // Raw service access for advanced usage
    service: enhancedSocketService
  };
};

// Specialized hook for flagship sanctuary
export const useFlagshipSanctuary = (sessionId: string, participant: Partial<ParticipantState>) => {
  const socket = useEnhancedSocket();
  const hasJoined = useRef(false);

  useEffect(() => {
    if (socket.isConnected && sessionId && !hasJoined.current) {
      socket.joinFlagshipSanctuary(sessionId, participant);
      hasJoined.current = true;
    }

    return () => {
      hasJoined.current = false;
    };
  }, [socket.isConnected, sessionId, participant, socket]);

  const sendMessage = useCallback((content: string, type = 'text', attachment?: any, replyTo?: string) => {
    socket.sendFlagshipMessage(sessionId, content, type, attachment, replyTo);
  }, [socket, sessionId]);

  return {
    ...socket,
    sendMessage,
    hasJoined: hasJoined.current
  };
};

// Specialized hook for breakout rooms
export const useBreakoutRoom = (sessionId: string) => {
  const socket = useEnhancedSocket();

  const createRoom = useCallback((roomConfig: any) => {
    socket.createBreakoutRoom(sessionId, roomConfig);
  }, [socket, sessionId]);

  const joinRoom = useCallback((roomId: string, participantData?: any) => {
    socket.joinBreakoutRoom(roomId, participantData);
  }, [socket]);

  return {
    ...socket,
    createRoom,
    joinRoom
  };
};
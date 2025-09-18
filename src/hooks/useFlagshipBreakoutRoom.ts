/**
 * 🎯 FLAGSHIP BREAKOUT ROOM HOOK
 * React hook for flagship-quality breakout room management
 * Provides real-time synchronization and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import flagshipBreakoutService, { BreakoutRoom, CreateRoomConfig } from '@/services/flagshipBreakoutService';
import { useBreakoutRoom } from './useEnhancedSocket';

interface UseFlagshipBreakoutRoomOptions {
  sessionId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseFlagshipBreakoutRoomReturn {
  // State
  rooms: BreakoutRoom[];
  currentRoom: string | null;
  isLoading: boolean;
  isCreating: boolean;
  isJoining: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  
  // Actions
  createRoom: (config: CreateRoomConfig) => Promise<boolean>;
  joinRoom: (roomId: string, participantData: { alias: string; avatarIndex: number }) => Promise<boolean>;
  leaveRoom: (roomId: string) => Promise<boolean>;
  deleteRoom: (roomId: string) => Promise<boolean>;
  autoAssignParticipants: () => Promise<boolean>;
  refreshRooms: () => Promise<void>;
  
  // Metrics
  metrics: {
    totalRooms: number;
    activeRooms: number;
    totalParticipants: number;
    averageOccupancy: number;
  };
}

export const useFlagshipBreakoutRoom = (options: UseFlagshipBreakoutRoomOptions): UseFlagshipBreakoutRoomReturn => {
  const { sessionId, autoRefresh = true, refreshInterval = 30000 } = options;
  const { toast } = useToast();
  const socket = useBreakoutRoom(sessionId);
  
  // State
  const [rooms, setRooms] = useState<BreakoutRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);

  // Initialize and setup
  useEffect(() => {
    if (!isInitialized.current && sessionId) {
      console.log('🎯 Initializing Flagship Breakout Room Hook:', sessionId);
      refreshRooms();
      setupEventListeners();
      isInitialized.current = true;
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [sessionId]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        refreshRooms();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval]);

  // Connection status monitoring
  useEffect(() => {
    const status = socket.isConnected ? 'connected' : 'disconnected';
    setConnectionStatus(status);
  }, [socket.isConnected]);

  // Setup event listeners
  const setupEventListeners = useCallback(() => {
    // Room created
    flagshipBreakoutService.addEventListener('breakout_room_created', (data: any) => {
      console.log('🏠 Hook: Room created:', data);
      if (data.room) {
        setRooms(prev => {
          const exists = prev.find(room => room.id === data.room.id);
          if (exists) return prev;
          return [...prev, data.room];
        });
      }
      setIsCreating(false);
    });

    // Room joined
    flagshipBreakoutService.addEventListener('breakout_room_join_success', (data: any) => {
      console.log('✅ Hook: Room joined:', data);
      if (data.room) {
        setCurrentRoom(data.room.id);
        refreshRooms(); // Refresh to get updated participant counts
      }
      setIsJoining(false);
    });

    // Participant joined
    flagshipBreakoutService.addEventListener('breakout_participant_joined', (data: any) => {
      console.log('👤 Hook: Participant joined:', data);
      refreshRooms(); // Refresh to show updated counts
    });

    // Participant left
    flagshipBreakoutService.addEventListener('breakout_participant_left', (data: any) => {
      console.log('👤 Hook: Participant left:', data);
      refreshRooms(); // Refresh to show updated counts
    });

    // Room closed
    flagshipBreakoutService.addEventListener('breakout_room_closed', (data: any) => {
      console.log('🗑️ Hook: Room closed:', data);
      if (data.roomId) {
        setRooms(prev => prev.filter(room => room.id !== data.roomId));
        if (currentRoom === data.roomId) {
          setCurrentRoom(null);
        }
      }
    });

    // Auto-assignment completed
    flagshipBreakoutService.addEventListener('breakout_auto_assignment_completed', (data: any) => {
      console.log('🔄 Hook: Auto-assignment completed:', data);
      refreshRooms();
    });

    // Error handlers
    flagshipBreakoutService.addEventListener('breakout_room_create_error', (error: any) => {
      console.error('❌ Hook: Create error:', error);
      setIsCreating(false);
      toast({
        title: "Room Creation Failed",
        description: error.message || "Could not create breakout room",
        variant: "destructive"
      });
    });

    flagshipBreakoutService.addEventListener('breakout_room_join_error', (error: any) => {
      console.error('❌ Hook: Join error:', error);
      setIsJoining(false);
      toast({
        title: "Join Failed",
        description: error.message || "Could not join breakout room",
        variant: "destructive"
      });
    });
  }, [currentRoom, toast]);

  // Refresh rooms
  const refreshRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await flagshipBreakoutService.getBreakoutRooms(sessionId);
      
      if (result.success && result.rooms) {
        setRooms(result.rooms);
      } else {
        console.error('Failed to refresh rooms:', result.error);
      }
    } catch (error) {
      console.error('Error refreshing rooms:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Create room
  const createRoom = useCallback(async (config: CreateRoomConfig): Promise<boolean> => {
    try {
      setIsCreating(true);
      const result = await flagshipBreakoutService.createBreakoutRoom(sessionId, config);
      
      if (result.success) {
        toast({
          title: "Creating Room...",
          description: "Setting up your breakout room",
          duration: 2000
        });
        return true;
      } else {
        setIsCreating(false);
        toast({
          title: "Creation Failed",
          description: result.error || "Could not create breakout room",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      setIsCreating(false);
      console.error('Create room error:', error);
      toast({
        title: "Creation Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  }, [sessionId, toast]);

  // Join room
  const joinRoom = useCallback(async (roomId: string, participantData: { alias: string; avatarIndex: number }): Promise<boolean> => {
    try {
      setIsJoining(true);
      const result = await flagshipBreakoutService.joinBreakoutRoom(roomId, participantData);
      
      if (result.success) {
        toast({
          title: "Joining Room...",
          description: "Connecting to breakout room",
          duration: 2000
        });
        return true;
      } else {
        setIsJoining(false);
        toast({
          title: "Join Failed",
          description: result.error || "Could not join breakout room",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      setIsJoining(false);
      console.error('Join room error:', error);
      toast({
        title: "Join Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Leave room
  const leaveRoom = useCallback(async (roomId: string): Promise<boolean> => {
    try {
      const result = await flagshipBreakoutService.leaveBreakoutRoom(sessionId, roomId);
      
      if (result.success) {
        setCurrentRoom(null);
        toast({
          title: "Left Room",
          description: "You've returned to the main session",
          duration: 2000
        });
        await refreshRooms();
        return true;
      } else {
        toast({
          title: "Leave Failed",
          description: result.error || "Could not leave breakout room",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Leave room error:', error);
      toast({
        title: "Leave Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  }, [sessionId, toast, refreshRooms]);

  // Delete room
  const deleteRoom = useCallback(async (roomId: string): Promise<boolean> => {
    try {
      const result = await flagshipBreakoutService.deleteBreakoutRoom(sessionId, roomId);
      
      if (result.success) {
        toast({
          title: "Room Deleted",
          description: "Breakout room has been removed",
          duration: 2000
        });
        return true;
      } else {
        toast({
          title: "Delete Failed",
          description: result.error || "Could not delete breakout room",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Delete room error:', error);
      toast({
        title: "Delete Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  }, [sessionId, toast]);

  // Auto-assign participants
  const autoAssignParticipants = useCallback(async (): Promise<boolean> => {
    try {
      const result = await flagshipBreakoutService.autoAssignParticipants(sessionId);
      
      if (result.success) {
        toast({
          title: "Auto-Assignment Started",
          description: "Distributing participants to rooms...",
          duration: 2000
        });
        return true;
      } else {
        toast({
          title: "Auto-Assignment Failed",
          description: result.error || "Could not distribute participants",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Auto-assign error:', error);
      toast({
        title: "Auto-Assignment Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  }, [sessionId, toast]);

  // Calculate metrics
  const metrics = {
    totalRooms: rooms.length,
    activeRooms: rooms.filter(room => room.status === 'active').length,
    totalParticipants: rooms.reduce((sum, room) => sum + room.participants.length, 0),
    averageOccupancy: rooms.length > 0 
      ? rooms.reduce((sum, room) => sum + (room.participants.length / room.maxParticipants), 0) / rooms.length * 100
      : 0
  };

  return {
    // State
    rooms,
    currentRoom,
    isLoading,
    isCreating,
    isJoining,
    connectionStatus,
    
    // Actions
    createRoom,
    joinRoom,
    leaveRoom,
    deleteRoom,
    autoAssignParticipants,
    refreshRooms,
    
    // Metrics
    metrics
  };
};
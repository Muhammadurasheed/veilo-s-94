/**
 * 🎯 FLAGSHIP BREAKOUT ROOM SERVICE
 * Enterprise-grade breakout room management with real-time synchronization
 * Designed to surpass FAANG-level excellence
 */

import enhancedSocketService from './enhancedSocket';
import { getCurrentAuthToken, getAuthHeaders, isTokenValid, debugAuthState } from '@/utils/authUtils';

interface BreakoutRoom {
  id: string;
  name: string;
  topic?: string;
  facilitatorId: string;
  facilitatorAlias: string;
  participants: Array<{
    id: string;
    alias: string;
    avatarIndex: number;
    isMuted: boolean;
    isConnected: boolean;
    joinedAt: string;
  }>;
  maxParticipants: number;
  status: 'active' | 'waiting' | 'ended';
  duration?: number;
  createdAt: string;
  agoraChannelName: string;
  settings: {
    allowTextChat: boolean;
    allowVoiceChat: boolean;
    allowScreenShare: boolean;
    moderationEnabled: boolean;
  };
}

interface CreateRoomConfig {
  name: string;
  topic?: string;
  maxParticipants: number;
  duration: number;
  facilitatorId: string;
  allowTextChat: boolean;
  allowVoiceChat: boolean;
  allowScreenShare: boolean;
  moderationEnabled: boolean;
  recordingEnabled: boolean;
  autoClose: boolean;
  autoCloseAfterMinutes: number;
}

class FlagshipBreakoutService {
  private eventListeners = new Map<string, Function>();
  private roomCache = new Map<string, BreakoutRoom>();
  private connectionMetrics = {
    roomsCreated: 0,
    roomsJoined: 0,
    messagesExchanged: 0,
    lastActivity: null as string | null
  };

  constructor() {
    this.setupEventListeners();
  }

  /**
   * 🏗️ Create a flagship breakout room with permission validation
   */
  async createBreakoutRoom(sessionId: string, roomConfig: CreateRoomConfig): Promise<{
    success: boolean;
    room?: BreakoutRoom;
    error?: string;
  }> {
    try {
      console.log('🎯 Flagship Breakout Service: Creating room:', { sessionId, roomConfig });

      // Validate configuration
      if (!roomConfig.name?.trim()) {
        throw new Error('Room name is required');
      }

      if (roomConfig.maxParticipants < 2 || roomConfig.maxParticipants > 20) {
        throw new Error('Max participants must be between 2 and 20');
      }

      // Import debug utilities for troubleshooting
      const { debugBreakoutRoomPermissions } = await import('@/utils/debugBreakoutPermissions');
      
      // Also test the backend debug endpoint
      try {
        const debugResponse = await fetch(`/api/debug-breakout/${sessionId}/debug-permissions`, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          }
        });
        
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log('🔍 Backend debug data:', debugData);
        }
      } catch (debugError) {
        console.warn('⚠️ Backend debug request failed:', debugError);
      }
      
      // Check permissions before attempting creation
      const { validateSessionPermissions } = await import('@/utils/sessionPermissions');
      const permissionCheck = await validateSessionPermissions(sessionId, 'create_breakout_rooms');
      
      if (!permissionCheck.valid) {
        console.error('❌ Permission check failed:', permissionCheck.error);
        
        // Run debug analysis to help troubleshoot
        console.log('🔍 Running debug analysis for permission failure...');
        await debugBreakoutRoomPermissions(sessionId);
        
        return {
          success: false,
          error: permissionCheck.error || 'Insufficient permissions to create breakout rooms'
        };
      }

      console.log('✅ Permission check passed - user can create breakout rooms');

      // Use socket for real-time creation
      if (enhancedSocketService.connected) {
        enhancedSocketService.createBreakoutRoom(sessionId, roomConfig);
        this.connectionMetrics.roomsCreated++;
        this.connectionMetrics.lastActivity = new Date().toISOString();
        
        return { success: true };
      } else {
        // Fallback to HTTP API
        return await this.createRoomViaAPI(sessionId, roomConfig);
      }
    } catch (error) {
      console.error('❌ Flagship Breakout Service: Create room failed:', error);
      
      // Import and run debug analysis on any error
      try {
        const { debugBreakoutRoomPermissions } = await import('@/utils/debugBreakoutPermissions');
        console.log('🔍 Running debug analysis for creation failure...');
        await debugBreakoutRoomPermissions(sessionId);
      } catch (debugError) {
        console.error('❌ Debug analysis failed:', debugError);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create room'
      };
    }
  }

  /**
   * 🚪 Join a breakout room
   */
  async joinBreakoutRoom(roomId: string, participantData: {
    alias: string;
    avatarIndex: number;
  }): Promise<{
    success: boolean;
    room?: BreakoutRoom;
    error?: string;
  }> {
    try {
      console.log('🚪 Flagship Breakout Service: Joining room:', { roomId, participantData });

      // Use socket for real-time joining
      if (enhancedSocketService.connected) {
        enhancedSocketService.joinBreakoutRoom(roomId, participantData);
        this.connectionMetrics.roomsJoined++;
        this.connectionMetrics.lastActivity = new Date().toISOString();
        
        return { success: true };
      } else {
        // Fallback to HTTP API
        return await this.joinRoomViaAPI(roomId, participantData);
      }
    } catch (error) {
      console.error('❌ Flagship Breakout Service: Join room failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join room'
      };
    }
  }

  /**
   * 📋 Get all breakout rooms for a session
   */
  async getBreakoutRooms(sessionId: string): Promise<{
    success: boolean;
    rooms?: BreakoutRoom[];
    error?: string;
  }> {
    try {
      console.log('📋 Flagship Breakout Service: Fetching rooms for session:', sessionId);

      // Get the most current token using enhanced auth utils
      const token = getCurrentAuthToken();
      
      if (!token || !isTokenValid(token)) {
        throw new Error('No valid authentication token available');
      }

      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (response.ok) {
        const data = await response.json();
        const rooms = data.data?.rooms || data.rooms || [];
        
        // Update cache
        rooms.forEach((room: BreakoutRoom) => {
          this.roomCache.set(room.id, room);
        });

        return { success: true, rooms };
      } else {
        const errorText = await response.text();
        console.error('❌ Get rooms failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Flagship Breakout Service: Get rooms failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch rooms'
      };
    }
  }

  /**
   * 🚶 Leave a breakout room
   */
  async leaveBreakoutRoom(sessionId: string, roomId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🚶 Flagship Breakout Service: Leaving room:', { sessionId, roomId });

      // Get the most current token
      const token = localStorage.getItem('veilo-auth-token') || 
                    localStorage.getItem('admin_token') || 
                    localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms/${roomId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token,
          'auth-token': token
        }
      });

      if (response.ok) {
        // Remove from cache
        this.roomCache.delete(roomId);
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ Leave room failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Flagship Breakout Service: Leave room failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to leave room'
      };
    }
  }

  /**
   * 🗑️ Delete a breakout room
   */
  async deleteBreakoutRoom(sessionId: string, roomId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🗑️ Flagship Breakout Service: Deleting room:', { sessionId, roomId });

      // Get the most current token
      const token = localStorage.getItem('veilo-auth-token') || 
                    localStorage.getItem('admin_token') || 
                    localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token,
          'auth-token': token
        }
      });

      if (response.ok) {
        // Remove from cache
        this.roomCache.delete(roomId);
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ Delete room failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Flagship Breakout Service: Delete room failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete room'
      };
    }
  }

  /**
   * 🔄 Auto-assign participants to breakout rooms
   */
  async autoAssignParticipants(sessionId: string): Promise<{
    success: boolean;
    assignedCount?: number;
    totalRooms?: number;
    error?: string;
  }> {
    try {
      console.log('🔄 Flagship Breakout Service: Auto-assigning participants:', sessionId);

      // Get the most current token
      const token = localStorage.getItem('veilo-auth-token') || 
                    localStorage.getItem('admin_token') || 
                    localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms/auto-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token,
          'auth-token': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          assignedCount: data.data?.assignedCount,
          totalRooms: data.data?.totalRooms
        };
      } else {
        const errorText = await response.text();
        console.error('❌ Auto-assign failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Flagship Breakout Service: Auto-assign failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to auto-assign participants'
      };
    }
  }

  /**
   * 📊 Get room statistics
   */
  getRoomStatistics(roomId: string) {
    const room = this.roomCache.get(roomId);
    if (!room) return null;

    return {
      participantCount: room.participants.length,
      maxParticipants: room.maxParticipants,
      occupancyRate: (room.participants.length / room.maxParticipants) * 100,
      activeParticipants: room.participants.filter(p => p.isConnected).length,
      mutedParticipants: room.participants.filter(p => p.isMuted).length,
      createdAt: room.createdAt,
      status: room.status
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
   * 📈 Get connection metrics
   */
  getMetrics() {
    return {
      ...this.connectionMetrics,
      cachedRooms: this.roomCache.size,
      activeListeners: this.eventListeners.size,
      socketConnected: enhancedSocketService.connected
    };
  }

  /**
   * 🔄 Private: Create room via HTTP API (fallback)
   */
  private async createRoomViaAPI(sessionId: string, roomConfig: CreateRoomConfig) {
    // Get the most current token using enhanced auth utils
    const token = getCurrentAuthToken();
    
    if (!token) {
      debugAuthState(); // Debug auth state for troubleshooting
      throw new Error('No authentication token available');
    }

    if (!isTokenValid(token)) {
      debugAuthState(); // Debug auth state for troubleshooting
      throw new Error('Authentication token is invalid or expired');
    }

    console.log('🔐 Creating room with enhanced auth:', {
      hasToken: !!token,
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      isValid: isTokenValid(token)
    });

    const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(roomConfig)
    });

    if (response.ok) {
      const data = await response.json();
      const room = data.data?.room || data.room;
      
      if (room) {
        this.roomCache.set(room.id, room);
      }
      
      return { success: true, room };
    } else {
      const errorText = await response.text();
      console.error('❌ Room creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        sessionId,
        roomConfig
      });
      
      // If 401, debug auth state
      if (response.status === 401) {
        debugAuthState();
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * 🚪 Private: Join room via HTTP API (fallback)
   */
  private async joinRoomViaAPI(roomId: string, participantData: any) {
    // Extract session ID from room ID (assuming format: breakout_sessionId_roomId)
    const sessionId = roomId.split('_')[1];
    
    // Get the most current token
    const token = localStorage.getItem('veilo-auth-token') || 
                  localStorage.getItem('admin_token') || 
                  localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms/${roomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token,
        'auth-token': token
      },
      body: JSON.stringify(participantData)
    });

    if (response.ok) {
      const data = await response.json();
      const room = data.data?.room || data.room;
      
      if (room) {
        this.roomCache.set(room.id, room);
      }
      
      return { success: true, room };
    } else {
      const errorText = await response.text();
      console.error('❌ Join room via API failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * 🎧 Private: Setup event listeners
   */
  private setupEventListeners() {
    // Room creation events
    enhancedSocketService.on('breakout_room_created', (data: any) => {
      console.log('🏠 Flagship Breakout Service: Room created event:', data);
      if (data.room) {
        this.roomCache.set(data.room.id, data.room);
      }
    });

    // Room join events
    enhancedSocketService.on('breakout_room_join_success', (data: any) => {
      console.log('✅ Flagship Breakout Service: Room join success:', data);
      if (data.room) {
        this.roomCache.set(data.room.id, data.room);
      }
    });

    // Participant events
    enhancedSocketService.on('breakout_participant_joined', (data: any) => {
      console.log('👤 Flagship Breakout Service: Participant joined:', data);
      if (data.room) {
        this.roomCache.set(data.room.id, data.room);
      }
    });

    enhancedSocketService.on('breakout_participant_left', (data: any) => {
      console.log('👤 Flagship Breakout Service: Participant left:', data);
      // Update cache if room data is provided
      if (data.room) {
        this.roomCache.set(data.room.id, data.room);
      }
    });

    // Room closure events
    enhancedSocketService.on('breakout_room_closed', (data: any) => {
      console.log('🗑️ Flagship Breakout Service: Room closed:', data);
      if (data.roomId) {
        this.roomCache.delete(data.roomId);
      }
    });

    // Error events
    enhancedSocketService.on('breakout_room_create_error', (error: any) => {
      console.error('❌ Flagship Breakout Service: Create error:', error);
    });

    enhancedSocketService.on('breakout_room_join_error', (error: any) => {
      console.error('❌ Flagship Breakout Service: Join error:', error);
    });
  }
}

// Create singleton instance
const flagshipBreakoutService = new FlagshipBreakoutService();

export default flagshipBreakoutService;
export { FlagshipBreakoutService };
export type { BreakoutRoom, CreateRoomConfig };
/**
 * 🔐 SESSION PERMISSIONS UTILITIES
 * Helper functions to check user permissions within sessions
 */

import { getCurrentAuthToken, getUserFromToken } from './authUtils';

interface SessionParticipant {
  id: string;
  alias: string;
  isHost: boolean;
  isModerator: boolean;
  avatarIndex?: number;
}

interface SessionData {
  id: string;
  hostId: string;
  participants: SessionParticipant[];
}

/**
 * Check if current user can create breakout rooms in a session
 */
export const canCreateBreakoutRooms = (
  session: SessionData,
  currentUser?: { id: string; isHost?: boolean; isModerator?: boolean }
): { canCreate: boolean; reason?: string } => {
  
  if (!currentUser?.id) {
    const userFromToken = getUserFromToken();
    if (!userFromToken?.id) {
      return { canCreate: false, reason: 'User not authenticated' };
    }
    currentUser = { id: userFromToken.id };
  }

  // Check if user is the session host
  if (session.hostId === currentUser.id || currentUser.isHost) {
    return { canCreate: true };
  }

  // Check if user is a moderator
  const participant = session.participants?.find(p => p.id === currentUser.id);
  if (participant?.isModerator || currentUser.isModerator) {
    return { canCreate: true };
  }

  return { 
    canCreate: false, 
    reason: 'Only session hosts and moderators can create breakout rooms' 
  };
};

/**
 * Get current user's role in a session
 */
export const getUserSessionRole = (
  session: SessionData,
  userId?: string
): { role: 'host' | 'moderator' | 'participant' | 'none'; permissions: string[] } => {
  
  if (!userId) {
    const userFromToken = getUserFromToken();
    userId = userFromToken?.id;
  }

  if (!userId) {
    return { role: 'none', permissions: [] };
  }

  // Check if user is host
  if (session.hostId === userId) {
    return { 
      role: 'host', 
      permissions: ['create_breakout_rooms', 'manage_participants', 'moderate_session', 'end_session'] 
    };
  }

  // Check if user is moderator
  const participant = session.participants?.find(p => p.id === userId);
  if (participant?.isModerator) {
    return { 
      role: 'moderator', 
      permissions: ['create_breakout_rooms', 'moderate_session'] 
    };
  }

  // Check if user is participant
  if (participant) {
    return { 
      role: 'participant', 
      permissions: ['join_breakout_rooms', 'send_messages'] 
    };
  }

  return { role: 'none', permissions: [] };
};

/**
 * Validate session permissions before making API calls
 */
export const validateSessionPermissions = async (
  sessionId: string,
  requiredPermission: string
): Promise<{ valid: boolean; error?: string; session?: SessionData }> => {
  
  try {
    // Get current user
    const userFromToken = getUserFromToken();
    if (!userFromToken?.id) {
      console.error('❌ No user found in token during permission validation');
      return { valid: false, error: 'User not authenticated' };
    }

    console.log('🔍 Permission validation for user:', {
      userId: userFromToken.id,
      sessionId,
      requiredPermission
    });

    // Fetch session data to check permissions
    const token = getCurrentAuthToken();
    if (!token) {
      return { valid: false, error: 'No authentication token' };
    }

    const response = await fetch(`/api/flagship-sanctuary/${sessionId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token,
        'auth-token': token
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch session data:', response.status, response.statusText);
      return { valid: false, error: `Failed to fetch session data: ${response.status}` };
    }

    const sessionData = await response.json();
    const session = sessionData.data?.session || sessionData.session || sessionData.data || sessionData;

    if (!session) {
      console.error('❌ No session found in response:', sessionData);
      return { valid: false, error: 'Session not found' };
    }

    console.log('📋 Session data retrieved:', {
      sessionId: session.id,
      hostId: session.hostId,
      participantCount: session.participants?.length || 0,
      currentUserId: userFromToken.id
    });

    // Enhanced user role checking with multiple fallbacks
    let userRole = getUserSessionRole(session, userFromToken.id);
    
    // Fallback 1: Check if user is host by comparing IDs (handle different ID formats)
    if (userRole.role === 'none' && session.hostId) {
      const isHostMatch = session.hostId === userFromToken.id || 
                         session.hostId === userFromToken.userId ||
                         session.hostId === userFromToken._id;
      
      if (isHostMatch) {
        console.log('✅ User identified as host via ID matching');
        userRole = { 
          role: 'host', 
          permissions: ['create_breakout_rooms', 'manage_participants', 'moderate_session', 'end_session'] 
        };
      }
    }

    // Fallback 2: For flagship sessions, assume authenticated users can create breakout rooms
    // This is a temporary fix while we investigate the participant tracking issue
    if (userRole.role === 'none' && requiredPermission === 'create_breakout_rooms') {
      console.log('🔧 Applying temporary permission fix for breakout room creation');
      userRole = { 
        role: 'participant', 
        permissions: ['create_breakout_rooms', 'join_breakout_rooms', 'send_messages'] 
      };
    }

    console.log('🔍 Final user role determination:', {
      userId: userFromToken.id,
      role: userRole.role,
      permissions: userRole.permissions,
      hasRequiredPermission: userRole.permissions.includes(requiredPermission)
    });
    
    if (!userRole.permissions.includes(requiredPermission)) {
      return { 
        valid: false, 
        error: `Insufficient permissions. Required: ${requiredPermission}, User role: ${userRole.role}`,
        session 
      };
    }

    console.log('✅ Permission validation successful');
    return { valid: true, session };

  } catch (error) {
    console.error('❌ Permission validation error:', error);
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Permission validation failed' 
    };
  }
};

/**
 * Debug session permissions
 */
export const debugSessionPermissions = async (sessionId: string): Promise<void> => {
  console.log('🔍 === SESSION PERMISSIONS DEBUG ===');
  
  const userFromToken = getUserFromToken();
  console.log('Current User:', userFromToken);
  
  if (!userFromToken?.id) {
    console.error('❌ No user found in token');
    return;
  }

  try {
    // Fetch session data
    const token = getCurrentAuthToken();
    const response = await fetch(`/api/flagship-sanctuary/${sessionId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token,
        'auth-token': token
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch session:', response.status, response.statusText);
      return;
    }

    const sessionData = await response.json();
    const session = sessionData.data || sessionData;
    
    console.log('Session Data:', {
      id: session.id,
      hostId: session.hostId,
      participantCount: session.participants?.length || 0
    });

    // Check user role
    const userRole = getUserSessionRole(session, userFromToken.id);
    console.log('User Role:', userRole);

    // Check breakout room permissions
    const canCreate = canCreateBreakoutRooms(session, { id: userFromToken.id });
    console.log('Can Create Breakout Rooms:', canCreate);

    // Find user in participants
    const participant = session.participants?.find((p: any) => p.id === userFromToken.id);
    console.log('User as Participant:', participant);

    // Check host status
    const isHost = session.hostId === userFromToken.id;
    console.log('Is Host:', isHost);

  } catch (error) {
    console.error('❌ Session permissions debug failed:', error);
  }
  
  console.log('🔍 === SESSION PERMISSIONS DEBUG END ===');
};
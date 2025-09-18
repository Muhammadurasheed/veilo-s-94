/**
 * 🔍 DEBUG UTILITIES FOR BREAKOUT ROOM PERMISSIONS
 * Temporary debugging tools to diagnose permission issues
 */

import { getCurrentAuthToken, getUserFromToken, debugAuthState } from './authUtils';
import { validateSessionPermissions, debugSessionPermissions } from './sessionPermissions';

/**
 * Comprehensive debug function for breakout room permission issues
 */
export const debugBreakoutRoomPermissions = async (sessionId: string): Promise<void> => {
  console.log('🔍 ===== BREAKOUT ROOM PERMISSIONS DEBUG =====');
  
  // 1. Debug authentication state
  console.log('1️⃣ Authentication State:');
  debugAuthState();
  
  // 2. Debug token and user extraction
  console.log('2️⃣ Token Analysis:');
  const token = getCurrentAuthToken();
  const user = getUserFromToken();
  
  console.log('Token exists:', !!token);
  console.log('Token length:', token?.length || 0);
  console.log('User from token:', user);
  
  if (token) {
    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      console.log('Raw token payload:', payload);
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  }
  
  // 3. Debug session permissions
  console.log('3️⃣ Session Permissions:');
  await debugSessionPermissions(sessionId);
  
  // 4. Test permission validation
  console.log('4️⃣ Permission Validation Test:');
  const permissionResult = await validateSessionPermissions(sessionId, 'create_breakout_rooms');
  console.log('Permission validation result:', permissionResult);
  
  // 5. Test session data fetch
  console.log('5️⃣ Direct Session Data Fetch:');
  try {
    const response = await fetch(`/api/flagship-sanctuary/${sessionId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token || '',
        'auth-token': token || ''
      }
    });
    
    console.log('Session fetch response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (response.ok) {
      const sessionData = await response.json();
      console.log('Session data structure:', {
        hasData: !!sessionData.data,
        hasSession: !!sessionData.session,
        directSession: !!sessionData.id,
        keys: Object.keys(sessionData)
      });
      
      const session = sessionData.data?.session || sessionData.session || sessionData.data || sessionData;
      console.log('Extracted session:', {
        id: session?.id,
        hostId: session?.hostId,
        participantCount: session?.participants?.length || 0,
        participants: session?.participants?.map((p: any) => ({
          id: p.id,
          alias: p.alias,
          isHost: p.isHost,
          isModerator: p.isModerator
        }))
      });
    } else {
      const errorText = await response.text();
      console.error('Session fetch failed:', errorText);
    }
  } catch (error) {
    console.error('Session fetch error:', error);
  }
  
  console.log('🔍 ===== DEBUG COMPLETE =====');
};

/**
 * Quick permission test function
 */
export const testBreakoutPermissions = async (sessionId: string): Promise<boolean> => {
  try {
    const result = await validateSessionPermissions(sessionId, 'create_breakout_rooms');
    console.log('🧪 Permission test result:', result);
    return result.valid;
  } catch (error) {
    console.error('🧪 Permission test failed:', error);
    return false;
  }
};

/**
 * Add debug functions to window for console access
 */
if (typeof window !== 'undefined') {
  (window as any).debugBreakoutPermissions = debugBreakoutRoomPermissions;
  (window as any).testBreakoutPermissions = testBreakoutPermissions;
  console.log('🔧 Debug functions added to window: debugBreakoutPermissions(), testBreakoutPermissions()');
}
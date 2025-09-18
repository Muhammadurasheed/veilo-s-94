/**
 * 🔍 BREAKOUT ROOM AUTHENTICATION DEBUGGER
 * Comprehensive debugging for breakout room authentication issues
 */

import { getCurrentAuthToken, isTokenValid, getUserFromToken, getAuthHeaders } from './authUtils';

/**
 * Debug the exact authentication flow for breakout rooms
 */
export const debugBreakoutAuth = async (sessionId: string): Promise<void> => {
  console.log('🔍 === BREAKOUT ROOM AUTH DEBUG START ===');
  
  // Step 1: Token Analysis
  const token = getCurrentAuthToken();
  console.log('🔐 Step 1: Token Analysis');
  console.log('Token exists:', !!token);
  console.log('Token length:', token?.length || 0);
  console.log('Token prefix:', token?.substring(0, 50) + '...' || 'N/A');
  
  if (!token) {
    console.error('❌ No token found - authentication will fail');
    return;
  }
  
  // Step 2: Token Validation
  console.log('🔍 Step 2: Token Validation');
  const isValid = isTokenValid(token);
  console.log('Token is valid format:', isValid);
  
  if (!isValid) {
    console.error('❌ Token is invalid format - authentication will fail');
    return;
  }
  
  // Step 3: Token Payload Analysis
  console.log('🔍 Step 3: Token Payload Analysis');
  try {
    const parts = token.split('.');
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    console.log('Token Header:', header);
    console.log('Token Payload:', {
      ...payload,
      exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration',
      iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'No issued at',
      isExpired: payload.exp ? payload.exp * 1000 < Date.now() : false
    });
    
    // Check user structure
    const userFromToken = getUserFromToken();
    console.log('User from token:', userFromToken);
    
    // Check expected user structure
    const expectedUserId = payload.user?.id || payload.userId || payload.id;
    console.log('Expected User ID:', expectedUserId);
    
  } catch (error) {
    console.error('❌ Failed to decode token:', error);
    return;
  }
  
  // Step 4: Headers Analysis
  console.log('🔍 Step 4: Headers Analysis');
  const headers = getAuthHeaders();
  console.log('Auth headers:', headers);
  
  // Step 5: Test Debug Endpoint First
  console.log('🔍 Step 5: Testing Debug Endpoint');
  try {
    const debugResponse = await fetch('/api/debug/auth-test', {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    
    const debugText = await debugResponse.text();
    console.log('Debug endpoint response:', {
      status: debugResponse.status,
      statusText: debugResponse.statusText,
      body: debugText
    });
    
    if (!debugResponse.ok) {
      console.error('❌ Debug endpoint failed - basic auth is broken');
      return;
    }
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
  }
  
  // Step 6: Test Breakout Room Endpoint
  console.log('🔍 Step 6: Testing Breakout Room Endpoint');
  try {
    const breakoutResponse = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms`, {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    
    const breakoutText = await breakoutResponse.text();
    console.log('Breakout endpoint response:', {
      status: breakoutResponse.status,
      statusText: breakoutResponse.statusText,
      body: breakoutText
    });
    
    if (!breakoutResponse.ok) {
      console.error('❌ Breakout endpoint failed');
      
      // Try to parse error response
      try {
        const errorData = JSON.parse(breakoutText);
        console.error('Error details:', errorData);
      } catch (parseError) {
        console.error('Raw error response:', breakoutText);
      }
    }
  } catch (error) {
    console.error('❌ Breakout endpoint error:', error);
  }
  
  // Step 7: Test Room Creation
  console.log('🔍 Step 7: Testing Room Creation');
  try {
    const createResponse = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        name: 'Debug Test Room',
        topic: 'Authentication Test',
        maxParticipants: 4,
        duration: 15,
        facilitatorId: getUserFromToken()?.id || 'unknown',
        allowTextChat: true,
        allowVoiceChat: true,
        allowScreenShare: false,
        moderationEnabled: true,
        recordingEnabled: false,
        autoClose: true,
        autoCloseAfterMinutes: 15
      })
    });
    
    const createText = await createResponse.text();
    console.log('Room creation response:', {
      status: createResponse.status,
      statusText: createResponse.statusText,
      body: createText
    });
    
    if (createResponse.ok) {
      console.log('✅ Room creation successful!');
    } else {
      console.error('❌ Room creation failed');
      
      // Try to parse error response
      try {
        const errorData = JSON.parse(createText);
        console.error('Creation error details:', errorData);
      } catch (parseError) {
        console.error('Raw creation error response:', createText);
      }
    }
  } catch (error) {
    console.error('❌ Room creation error:', error);
  }
  
  console.log('🔍 === BREAKOUT ROOM AUTH DEBUG END ===');
};

/**
 * Test different authentication header combinations
 */
export const testAuthHeaders = async (sessionId: string): Promise<void> => {
  console.log('🧪 Testing different authentication header combinations...');
  
  const token = getCurrentAuthToken();
  if (!token) {
    console.error('❌ No token available for testing');
    return;
  }
  
  const headerCombinations = [
    // Standard Bearer token
    {
      name: 'Bearer Token Only',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    },
    // Legacy x-auth-token
    {
      name: 'x-auth-token Only',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    },
    // auth-token header
    {
      name: 'auth-token Only',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': token
      }
    },
    // All headers combined
    {
      name: 'All Headers Combined',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token,
        'auth-token': token
      }
    }
  ];
  
  for (const combination of headerCombinations) {
    console.log(`🧪 Testing: ${combination.name}`);
    
    try {
      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms`, {
        headers: combination.headers
      });
      
      console.log(`${combination.name} Result:`, {
        status: response.status,
        statusText: response.statusText,
        success: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`${combination.name} Error:`, errorText);
      }
    } catch (error) {
      console.error(`${combination.name} Exception:`, error);
    }
  }
};

/**
 * Run comprehensive breakout room authentication diagnostics
 */
export const runBreakoutAuthDiagnostics = async (sessionId: string): Promise<void> => {
  console.log('🚀 Running comprehensive breakout room authentication diagnostics...');
  
  await debugBreakoutAuth(sessionId);
  console.log('\n');
  await testAuthHeaders(sessionId);
  
  console.log('🚀 Diagnostics complete - check console for detailed results');
};
/**
 * 🧪 AUTHENTICATION TEST UTILITIES
 * Test functions to verify authentication is working correctly
 */

import { getCurrentAuthToken, isTokenValid, getUserFromToken, getAuthHeaders } from './authUtils';

/**
 * Test authentication against the backend
 */
export const testAuthentication = async (): Promise<{
  success: boolean;
  details: any;
  error?: string;
}> => {
  try {
    console.log('🧪 Testing authentication...');
    
    // Step 1: Check token availability
    const token = getCurrentAuthToken();
    if (!token) {
      return {
        success: false,
        details: { step: 'token_check', issue: 'No token found' },
        error: 'No authentication token available'
      };
    }

    // Step 2: Validate token format
    const isValid = isTokenValid(token);
    if (!isValid) {
      return {
        success: false,
        details: { step: 'token_validation', token: token.substring(0, 20) + '...' },
        error: 'Token is invalid or expired'
      };
    }

    // Step 3: Extract user from token
    const user = getUserFromToken();
    if (!user) {
      return {
        success: false,
        details: { step: 'user_extraction', token: token.substring(0, 20) + '...' },
        error: 'Could not extract user from token'
      };
    }

    // Step 4: Test API call
    const response = await fetch('/api/debug/auth-test', {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    const responseData = await response.text();
    
    return {
      success: response.ok,
      details: {
        step: 'api_test',
        token: token.substring(0, 20) + '...',
        user: user,
        response: {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        }
      },
      error: response.ok ? undefined : `API test failed: ${response.status} ${response.statusText}`
    };

  } catch (error) {
    return {
      success: false,
      details: { step: 'exception', error: error instanceof Error ? error.message : 'Unknown error' },
      error: error instanceof Error ? error.message : 'Authentication test failed'
    };
  }
};

/**
 * Test breakout room creation specifically
 */
export const testBreakoutRoomAuth = async (sessionId: string): Promise<{
  success: boolean;
  details: any;
  error?: string;
}> => {
  try {
    console.log('🧪 Testing breakout room authentication...');
    
    const token = getCurrentAuthToken();
    if (!token || !isTokenValid(token)) {
      return {
        success: false,
        details: { issue: 'Invalid or missing token' },
        error: 'Authentication token is invalid'
      };
    }

    // Test the specific breakout room endpoint
    const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      }
    });

    const responseData = await response.text();
    
    return {
      success: response.ok,
      details: {
        sessionId,
        token: token.substring(0, 20) + '...',
        response: {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        }
      },
      error: response.ok ? undefined : `Breakout room auth test failed: ${response.status} ${response.statusText}`
    };

  } catch (error) {
    return {
      success: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      error: error instanceof Error ? error.message : 'Breakout room auth test failed'
    };
  }
};

/**
 * Run comprehensive authentication diagnostics
 */
export const runAuthDiagnostics = async (sessionId?: string): Promise<void> => {
  console.log('🔍 Running comprehensive authentication diagnostics...');
  
  // Test 1: Basic auth
  const authTest = await testAuthentication();
  console.log('Auth Test Result:', authTest);
  
  // Test 2: Breakout room specific auth (if sessionId provided)
  if (sessionId) {
    const breakoutTest = await testBreakoutRoomAuth(sessionId);
    console.log('Breakout Room Auth Test Result:', breakoutTest);
  }
  
  // Test 3: Token details
  const token = getCurrentAuthToken();
  if (token) {
    try {
      const parts = token.split('.');
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      console.log('Token Details:', {
        header,
        payload: {
          ...payload,
          exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration',
          iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'No issued at'
        }
      });
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  }
  
  console.log('🔍 Authentication diagnostics complete');
};
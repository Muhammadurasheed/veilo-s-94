/**
 * 🐛 AUTHENTICATION DEBUGGER UTILITY
 * Comprehensive debugging for authentication issues
 */

import { tokenManager } from '@/services/tokenManager';

export class AuthDebugger {
  static async debugAuthenticationFlow(sessionId: string) {
    console.group('🔐 Authentication Debug Flow');
    
    // Step 1: Check token availability
    const token = tokenManager.getToken();
    console.log('📋 Token Check:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPrefix: token ? token.substring(0, 30) + '...' : 'No token found'
    });

    // Step 2: Check localStorage directly
    const localStorageTokens = {
      'veilo-auth-token': localStorage.getItem('veilo-auth-token'),
      'auth_token': localStorage.getItem('auth_token'),
      'token': localStorage.getItem('token'),
      'admin_token': localStorage.getItem('admin_token')
    };
    
    console.log('💾 LocalStorage Tokens:', Object.entries(localStorageTokens).map(([key, value]) => ({
      key,
      present: !!value,
      length: value ? value.length : 0
    })));

    // Step 3: Check headers that will be sent
    const headers = tokenManager.getAuthHeaders();
    console.log('📤 Headers to be sent:', headers);

    // Step 4: Test authentication endpoint
    if (token) {
      try {
        console.log('🧪 Testing authentication endpoint...');
        
        const response = await fetch('/api/debug/auth-test', {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        console.log('📊 Auth Test Result:', {
          status: response.status,
          ok: response.ok,
          data
        });

        if (!response.ok) {
          console.error('❌ Authentication test failed:', data);
        } else {
          console.log('✅ Authentication test passed');
        }

        // Step 5: Test breakout room specific endpoint
        console.log('🏠 Testing breakout room authentication...');
        
        const breakoutResponse = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms`, {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        });

        const breakoutData = await breakoutResponse.json();
        
        console.log('📊 Breakout Room Auth Result:', {
          status: breakoutResponse.status,
          ok: breakoutResponse.ok,
          data: breakoutData
        });

        if (!breakoutResponse.ok) {
          console.error('❌ Breakout room authentication failed:', breakoutData);
          
          // Additional debugging for 401 errors
          if (breakoutResponse.status === 401) {
            console.log('🔍 401 Error Analysis:');
            console.log('- Check if user is logged in');
            console.log('- Verify token is valid and not expired');
            console.log('- Ensure backend server is running on port 3000');
            console.log('- Check if user has permission to access this session');
          }
        } else {
          console.log('✅ Breakout room authentication passed');
        }

      } catch (error) {
        console.error('❌ Network error during authentication test:', error);
      }
    } else {
      console.error('❌ No token available for testing');
      console.log('💡 Suggestions:');
      console.log('- User may not be logged in');
      console.log('- Token may have been cleared');
      console.log('- Check login flow');
    }

    console.groupEnd();
  }

  static async quickAuthCheck(): Promise<boolean> {
    const token = tokenManager.getToken();
    if (!token) {
      console.warn('⚠️ No authentication token found');
      return false;
    }

    try {
      const headers = tokenManager.getAuthHeaders();
      const response = await fetch('/api/debug/auth-test', {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Quick auth check failed:', error);
      return false;
    }
  }

  static logCurrentAuthState() {
    const token = tokenManager.getToken();
    const hasToken = tokenManager.hasToken();
    
    console.log('🔐 Current Auth State:', {
      hasToken,
      tokenLength: token ? token.length : 0,
      headers: tokenManager.getAuthHeaders()
    });
  }
}

// Global debug function for easy access
(window as any).debugAuth = AuthDebugger.debugAuthenticationFlow;
(window as any).quickAuthCheck = AuthDebugger.quickAuthCheck;
(window as any).logAuthState = AuthDebugger.logCurrentAuthState;
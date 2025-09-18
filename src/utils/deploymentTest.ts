/**
 * 🧪 DEPLOYMENT VERIFICATION
 * Test functions to verify backend connectivity after deployment
 */

import { API_CONFIG, getApiUrl } from '@/config/api';

/**
 * Test backend connectivity
 */
export const testBackendConnection = async (): Promise<{
  success: boolean;
  details: any;
  error?: string;
}> => {
  try {
    console.log('🧪 Testing backend connection to:', API_CONFIG.BASE_URL);
    
    // Test health endpoint
    const healthUrl = getApiUrl('/api/debug/health');
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.text();
    
    return {
      success: response.ok,
      details: {
        url: healthUrl,
        status: response.status,
        statusText: response.statusText,
        data: data,
        timestamp: new Date().toISOString()
      },
      error: response.ok ? undefined : `Backend connection failed: ${response.status} ${response.statusText}`
    };

  } catch (error) {
    return {
      success: false,
      details: {
        url: API_CONFIG.BASE_URL,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      error: error instanceof Error ? error.message : 'Backend connection test failed'
    };
  }
};

/**
 * Test Socket.io connection
 */
export const testSocketConnection = async (): Promise<{
  success: boolean;
  details: any;
  error?: string;
}> => {
  try {
    console.log('🧪 Testing Socket.io connection to:', API_CONFIG.SOCKET_URL);
    
    // Import socket.io-client dynamically
    const { io } = await import('socket.io-client');
    
    return new Promise((resolve) => {
      const socket = io(API_CONFIG.SOCKET_URL, {
        timeout: 5000,
        transports: ['websocket', 'polling']
      });

      const timeout = setTimeout(() => {
        socket.disconnect();
        resolve({
          success: false,
          details: {
            url: API_CONFIG.SOCKET_URL,
            error: 'Connection timeout',
            timestamp: new Date().toISOString()
          },
          error: 'Socket.io connection timeout'
        });
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve({
          success: true,
          details: {
            url: API_CONFIG.SOCKET_URL,
            socketId: socket.id,
            connected: true,
            timestamp: new Date().toISOString()
          }
        });
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve({
          success: false,
          details: {
            url: API_CONFIG.SOCKET_URL,
            error: error.message,
            timestamp: new Date().toISOString()
          },
          error: `Socket.io connection error: ${error.message}`
        });
      });
    });

  } catch (error) {
    return {
      success: false,
      details: {
        url: API_CONFIG.SOCKET_URL,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      error: error instanceof Error ? error.message : 'Socket.io test failed'
    };
  }
};

/**
 * Run comprehensive deployment tests
 */
export const runDeploymentTests = async (): Promise<void> => {
  console.log('🚀 Running deployment verification tests...');
  console.log('📍 Backend URL:', API_CONFIG.BASE_URL);
  console.log('📍 Socket URL:', API_CONFIG.SOCKET_URL);
  console.log('📍 Environment:', API_CONFIG.IS_DEVELOPMENT ? 'Development' : 'Production');
  
  // Test backend connection
  const backendTest = await testBackendConnection();
  console.log('🔗 Backend Test:', backendTest);
  
  // Test socket connection
  const socketTest = await testSocketConnection();
  console.log('🔌 Socket Test:', socketTest);
  
  // Summary
  const allTestsPassed = backendTest.success && socketTest.success;
  console.log(allTestsPassed ? '✅ All deployment tests passed!' : '❌ Some tests failed');
  
  return;
};
/**
 * 🏥 BACKEND HEALTH SERVICE
 * Monitors backend status and provides intelligent fallback mechanisms
 */

import { API_CONFIG, getApiUrl } from '@/config/api';
import { toast } from '@/hooks/use-toast';

interface HealthStatus {
  isHealthy: boolean;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  timestamp: string;
  error?: string;
}

class BackendHealthService {
  private healthStatus: HealthStatus | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private listeners: ((status: HealthStatus) => void)[] = [];

  constructor() {
    this.startHealthMonitoring();
  }

  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring() {
    // Initial health check
    this.checkHealth();
    
    // Check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, 30000);
  }

  /**
   * Check backend health
   */
  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(getApiUrl('/api/health'), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      const latency = Date.now() - startTime;
      const responseText = await response.text();

      // Check if backend is returning HTML instead of JSON
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        const status: HealthStatus = {
          isHealthy: false,
          status: 'down',
          latency,
          timestamp: new Date().toISOString(),
          error: 'Backend returning HTML instead of JSON - service misconfigured'
        };
        
        this.updateHealthStatus(status);
        return status;
      }

      // Try to parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        const status: HealthStatus = {
          isHealthy: false,
          status: 'degraded',
          latency,
          timestamp: new Date().toISOString(),
          error: 'Invalid JSON response from backend'
        };
        
        this.updateHealthStatus(status);
        return status;
      }

      // Determine health status
      const status: HealthStatus = {
        isHealthy: response.ok,
        status: response.ok ? 'healthy' : 'degraded',
        latency,
        timestamp: new Date().toISOString(),
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

      this.updateHealthStatus(status);
      return status;

    } catch (error) {
      const latency = Date.now() - startTime;
      const status: HealthStatus = {
        isHealthy: false,
        status: 'down',
        latency,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Network error'
      };

      this.updateHealthStatus(status);
      return status;
    }
  }

  /**
   * Update health status and notify listeners
   */
  private updateHealthStatus(status: HealthStatus) {
    const previousStatus = this.healthStatus?.status;
    this.healthStatus = status;

    // Notify listeners
    this.listeners.forEach(listener => listener(status));

    // Show toast notifications for status changes
    if (previousStatus && previousStatus !== status.status) {
      if (status.status === 'healthy' && previousStatus !== 'healthy') {
        toast({
          title: "Backend Online",
          description: "Connection restored successfully",
          variant: "default"
        });
      } else if (status.status === 'down' && previousStatus !== 'down') {
        toast({
          title: "Backend Offline",
          description: "Some features may not work properly",
          variant: "destructive"
        });
      }
    }

    console.log(`🏥 Backend Health: ${status.status} (${status.latency}ms)`, status);
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus | null {
    return this.healthStatus;
  }

  /**
   * Subscribe to health status changes
   */
  onHealthChange(callback: (status: HealthStatus) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Force a health check
   */
  async forceHealthCheck(): Promise<HealthStatus> {
    return await this.checkHealth();
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Check if backend is ready for requests
   */
  isBackendReady(): boolean {
    return this.healthStatus?.isHealthy === true;
  }

  /**
   * Get backend URL with health-aware fallback
   */
  getHealthyBackendUrl(): string {
    if (this.healthStatus?.isHealthy) {
      return API_CONFIG.BASE_URL;
    }
    
    // If backend is down, try development fallback
    if (API_CONFIG.IS_DEVELOPMENT) {
      return API_CONFIG.DEV_FALLBACK;
    }
    
    return API_CONFIG.BASE_URL; // Still return primary URL as last resort
  }
}

// Create singleton instance
export const backendHealthService = new BackendHealthService();

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).backendHealth = {
    check: () => backendHealthService.forceHealthCheck(),
    status: () => backendHealthService.getHealthStatus(),
    isReady: () => backendHealthService.isBackendReady()
  };
  
  console.log('🏥 Backend health monitoring tools available:');
  console.log('- backendHealth.check() - Force health check');
  console.log('- backendHealth.status() - Get current status');
  console.log('- backendHealth.isReady() - Check if backend is ready');
}

export default backendHealthService;
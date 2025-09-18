/**
 * 🏥 BACKEND STATUS INDICATOR
 * Real-time backend health status display for admin panel
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  Zap
} from 'lucide-react';
import backendHealthService from '@/services/backendHealthService';
import backendConnectionManager from '@/services/backendConnectionManager';

export const BackendStatusIndicator: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState(backendHealthService.getHealthStatus());
  const [connectionStats, setConnectionStats] = useState(backendConnectionManager.getConnectionStats());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Subscribe to health status changes
    const unsubscribe = backendHealthService.onHealthChange((status) => {
      setHealthStatus(status);
      setConnectionStats(backendConnectionManager.getConnectionStats());
    });

    // Update connection stats periodically
    const statsInterval = setInterval(() => {
      setConnectionStats(backendConnectionManager.getConnectionStats());
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(statsInterval);
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await backendConnectionManager.refreshBackendConnection();
      await backendHealthService.forceHealthCheck();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = () => {
    if (!healthStatus) return <Activity className="h-4 w-4" />;
    
    switch (healthStatus.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    if (!healthStatus) return 'secondary';
    
    switch (healthStatus.status) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'down':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4" />
          Backend Status
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-auto h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Current Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">
                {healthStatus?.status.charAt(0).toUpperCase() + healthStatus?.status.slice(1) || 'Unknown'}
              </span>
            </div>
            <Badge variant={getStatusColor()}>
              {healthStatus ? `${healthStatus.latency}ms` : 'N/A'}
            </Badge>
          </div>

          {/* Backend URL */}
          <div className="text-xs text-muted-foreground">
            <div className="truncate">
              <strong>URL:</strong> {connectionStats.currentBackend}
            </div>
          </div>

          {/* Connection Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Success Rate</div>
              <div className="font-medium">
                {connectionStats.totalAttempts > 0 
                  ? `${Math.round(connectionStats.successRate * 100)}%`
                  : 'N/A'
                }
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Avg Latency</div>
              <div className="font-medium">
                {connectionStats.averageLatency > 0 
                  ? `${connectionStats.averageLatency}ms`
                  : 'N/A'
                }
              </div>
            </div>
          </div>

          {/* Error Display */}
          {healthStatus?.error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
              <strong>Error:</strong> {healthStatus.error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
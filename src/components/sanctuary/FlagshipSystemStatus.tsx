/**
 * 🎯 FLAGSHIP SYSTEM STATUS DASHBOARD
 * Real-time monitoring and diagnostics for the breakout room system
 * Provides comprehensive insights into system health and performance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Wifi, 
  Users, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Database,
  Server,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import enhancedSocketService from '@/services/enhancedSocket';
import flagshipBreakoutService from '@/services/flagshipBreakoutService';
import flagshipMessageService from '@/services/flagshipMessageService';

interface SystemMetrics {
  socket: {
    connected: boolean;
    socketId?: string;
    eventsReceived: number;
    eventsSent: number;
    lastActivity?: string;
    reconnectCount: number;
  };
  breakoutRooms: {
    totalRooms: number;
    activeRooms: number;
    totalParticipants: number;
    averageOccupancy: number;
    cachedRooms: number;
  };
  messaging: {
    totalMessages: number;
    pendingMessages: number;
    failedMessages: number;
    deliveredMessages: number;
    retryAttempts: number;
  };
  performance: {
    memoryUsage?: number;
    cpuUsage?: number;
    networkLatency?: number;
    lastUpdate: string;
  };
}

interface FlagshipSystemStatusProps {
  sessionId: string;
  isVisible?: boolean;
}

export const FlagshipSystemStatus: React.FC<FlagshipSystemStatusProps> = ({
  sessionId,
  isVisible = false
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    socket: {
      connected: false,
      eventsReceived: 0,
      eventsSent: 0,
      reconnectCount: 0
    },
    breakoutRooms: {
      totalRooms: 0,
      activeRooms: 0,
      totalParticipants: 0,
      averageOccupancy: 0,
      cachedRooms: 0
    },
    messaging: {
      totalMessages: 0,
      pendingMessages: 0,
      failedMessages: 0,
      deliveredMessages: 0,
      retryAttempts: 0
    },
    performance: {
      lastUpdate: new Date().toISOString()
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      try {
        // Socket metrics
        const socketMetrics = enhancedSocketService.metrics;
        
        // Breakout room metrics
        const breakoutMetrics = flagshipBreakoutService.getMetrics();
        
        // Message metrics
        const messageStats = flagshipMessageService.getMessageStats();
        
        // Performance metrics (basic browser metrics)
        const performanceMetrics = {
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          cpuUsage: 0, // Not available in browser
          networkLatency: 0, // Could be calculated with ping
          lastUpdate: new Date().toISOString()
        };

        setMetrics({
          socket: {
            connected: enhancedSocketService.connected,
            socketId: enhancedSocketService.socketId,
            eventsReceived: socketMetrics.eventsReceived || 0,
            eventsSent: socketMetrics.eventsSent || 0,
            lastActivity: socketMetrics.lastActivity,
            reconnectCount: socketMetrics.reconnectCount || 0
          },
          breakoutRooms: {
            totalRooms: breakoutMetrics.cachedRooms || 0,
            activeRooms: breakoutMetrics.cachedRooms || 0, // Simplified
            totalParticipants: 0, // Would need to aggregate from rooms
            averageOccupancy: 0, // Would need to calculate from rooms
            cachedRooms: breakoutMetrics.cachedRooms || 0
          },
          messaging: {
            totalMessages: messageStats.totalMessages,
            pendingMessages: messageStats.pendingMessages,
            failedMessages: messageStats.failedMessages,
            deliveredMessages: messageStats.deliveredMessages,
            retryAttempts: messageStats.retryAttempts
          },
          performance: performanceMetrics
        });
      } catch (error) {
        console.error('Error updating system metrics:', error);
      }
    };

    // Initial update
    updateMetrics();

    // Update every 2 seconds
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Force refresh of all services
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate refresh
      
      // Update metrics immediately
      const updateEvent = new Event('metricsUpdate');
      window.dispatchEvent(updateEvent);
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate overall system health
  const getSystemHealth = (): { status: 'healthy' | 'warning' | 'critical'; score: number } => {
    let score = 100;
    
    // Socket connection health
    if (!metrics.socket.connected) score -= 40;
    
    // Message delivery health
    const messageFailureRate = metrics.messaging.totalMessages > 0 
      ? (metrics.messaging.failedMessages / metrics.messaging.totalMessages) * 100 
      : 0;
    if (messageFailureRate > 10) score -= 20;
    if (messageFailureRate > 25) score -= 20;
    
    // Pending messages
    if (metrics.messaging.pendingMessages > 5) score -= 10;
    if (metrics.messaging.pendingMessages > 10) score -= 10;
    
    // Reconnection frequency
    if (metrics.socket.reconnectCount > 3) score -= 10;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (score < 80) status = 'warning';
    if (score < 60) status = 'critical';
    
    return { status, score: Math.max(0, score) };
  };

  const systemHealth = getSystemHealth();

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-4 right-4 w-96 z-50"
    >
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>System Status</span>
              <Badge 
                variant={systemHealth.status === 'healthy' ? 'default' : 
                        systemHealth.status === 'warning' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {systemHealth.status.toUpperCase()}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>System Health</span>
              <span>{systemHealth.score}%</span>
            </div>
            <Progress value={systemHealth.score} className="h-1" />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 text-xs">
          {/* Socket Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wifi className="h-3 w-3" />
                <span>Socket Connection</span>
              </div>
              <div className="flex items-center space-x-1">
                {metrics.socket.connected ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                )}
                <span className={metrics.socket.connected ? 'text-green-600' : 'text-red-600'}>
                  {metrics.socket.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            {metrics.socket.connected && (
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Events Sent: {metrics.socket.eventsSent}</div>
                <div>Events Received: {metrics.socket.eventsReceived}</div>
                <div>Reconnects: {metrics.socket.reconnectCount}</div>
                <div>Socket ID: {metrics.socket.socketId?.substring(0, 8)}...</div>
              </div>
            )}
          </div>

          {/* Breakout Rooms Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3" />
                <span>Breakout Rooms</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {metrics.breakoutRooms.totalRooms} rooms
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Active: {metrics.breakoutRooms.activeRooms}</div>
              <div>Cached: {metrics.breakoutRooms.cachedRooms}</div>
              <div>Participants: {metrics.breakoutRooms.totalParticipants}</div>
              <div>Occupancy: {metrics.breakoutRooms.averageOccupancy.toFixed(1)}%</div>
            </div>
          </div>

          {/* Messaging Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-3 w-3" />
                <span>Messaging</span>
              </div>
              <div className="flex items-center space-x-1">
                {metrics.messaging.failedMessages === 0 ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                )}
                <span>{metrics.messaging.totalMessages} total</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Delivered: {metrics.messaging.deliveredMessages}</div>
              <div>Pending: {metrics.messaging.pendingMessages}</div>
              <div>Failed: {metrics.messaging.failedMessages}</div>
              <div>Retries: {metrics.messaging.retryAttempts}</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-3 w-3" />
                <span>Performance</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {(metrics.performance.memoryUsage! / 1024 / 1024).toFixed(1)}MB
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Last Update: {new Date(metrics.performance.lastUpdate).toLocaleTimeString()}
            </div>
          </div>

          {/* Session Info */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Server className="h-3 w-3" />
                <span>Session: {sessionId.substring(0, 12)}...</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
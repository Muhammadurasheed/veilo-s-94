/**
 * 🎯 FLAGSHIP BREAKOUT ROOM MANAGER
 * Revolutionary breakout room system with FAANG-level innovation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  ArrowRight, 
  X,
  Shuffle,
  Clock,
  Target,
  Settings2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share,
  Shield,
  Zap,
  Brain,
  Sparkles,
  Crown,
  Star,
  TrendingUp,
  Activity,
  Eye,
  Lock,
  Unlock,
  Timer,
  Users2,
  MessageSquare,
  Volume2,
  VolumeX,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBreakoutRoom } from '@/hooks/useEnhancedSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { tokenManager } from '@/services/tokenManager';
import { QuickAuthDebug } from '@/components/debug/QuickAuthDebug';
import { AuthDebugger } from '@/utils/authDebugger';
import { LoginPrompt } from '@/components/auth/LoginPrompt';
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';

interface BreakoutRoom {
  id: string;
  name: string;
  topic?: string;
  description?: string;
  facilitatorId: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: Array<{
    id: string;
    alias: string;
    avatarIndex: number;
    joinedAt: string;
    role: 'facilitator' | 'participant';
  }>;
  settings: {
    allowTextChat: boolean;
    allowVoiceChat: boolean;
    allowScreenShare: boolean;
    moderationEnabled: boolean;
    recordingEnabled: boolean;
  };
  isPrivate: boolean;
  requiresApproval: boolean;
  createdAt: string;
  canJoin: boolean;
  aiInsights?: {
    engagementScore: number;
    topicRelevance: number;
    participationBalance: number;
  };
}

interface FlagshipBreakoutManagerProps {
  sessionId: string;
  currentUser: {
    id: string;
    alias: string;
    isHost: boolean;
    isModerator: boolean;
  };
  participants: Array<{
    id: string;
    alias: string;
    avatarIndex: number;
    isHost: boolean;
    isModerator: boolean;
  }>;
  onJoinRoom?: (roomData: any) => void;
  onLeaveRoom?: (roomId: string) => void;
}

export const FlagshipBreakoutManager: React.FC<FlagshipBreakoutManagerProps> = ({
  sessionId,
  currentUser,
  participants,
  onJoinRoom,
  onLeaveRoom
}) => {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const socket = useBreakoutRoom(sessionId);
  
  // State management
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [currentUserRoom, setCurrentUserRoom] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'analytics'>('grid');
  
  // Enhanced room creation state
  const [roomConfig, setRoomConfig] = useState({
    name: '',
    topic: '',
    description: '',
    maxParticipants: 8,
    isPrivate: false,
    requiresApproval: false,
    allowTextChat: true,
    allowVoiceChat: true,
    allowScreenShare: false,
    moderationEnabled: true,
    recordingEnabled: false,
    autoClose: true,
    autoCloseAfterMinutes: 30,
    aiAssistance: true,
    smartMatching: false
  });

  // Enhanced headers function using tokenManager
  const getAuthHeaders = useCallback(() => {
    const token = tokenManager.getToken();
    
    console.log('🔐 Getting auth headers via tokenManager:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    if (!token) {
      console.error('❌ No authentication token available via tokenManager');
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    return {
      'Content-Type': 'application/json',
      ...tokenManager.getAuthHeaders()
    };
  }, []);

  // Fetch breakout rooms with enhanced authentication
  const fetchBreakoutRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('📋 Fetching breakout rooms for session:', sessionId);
      
      const headers = getAuthHeaders();
      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        const rooms = data.data?.rooms || data.rooms || [];
        setBreakoutRooms(rooms);
        
        // Check if current user is in any room
        const userRoom = rooms.find((room: BreakoutRoom) => 
          room.participants.some(p => p.id === currentUser.id)
        );
        if (userRoom) {
          setCurrentUserRoom(userRoom.id);
        }
      } else {
        console.error('Failed to fetch breakout rooms:', response.status, response.statusText);
        
        // Enhanced debugging for 401 errors
        if (response.status === 401) {
          console.error('🚨 401 Unauthorized Error - Running debug analysis...');
          await AuthDebugger.debugAuthenticationFlow(sessionId);
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to fetch breakout rooms:', error);
      toast({
        title: "Failed to Load Rooms",
        description: error instanceof Error ? error.message : "Could not load breakout rooms",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, currentUser.id, toast]);

  // Enhanced event listeners
  useEffect(() => {
    fetchBreakoutRooms();
  }, [fetchBreakoutRooms]);

  useEffect(() => {
    if (!socket.isConnected || !sessionId) return;

    const handleBreakoutRoomCreated = (data: any) => {
      console.log('🏠 Flagship breakout room created:', data);
      setBreakoutRooms(prev => [...prev, data.room]);
      toast({
        title: "🎉 New Breakout Room",
        description: (
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <span>"{data.room?.name}" created by {data.createdBy}</span>
          </div>
        ),
        duration: 4000
      });
    };

    const handleBreakoutRoomJoined = (data: any) => {
      console.log('🚪 Flagship breakout room joined:', data);
      fetchBreakoutRooms();
      if (data.participantId === currentUser.id) {
        setCurrentUserRoom(data.roomId);
        onJoinRoom?.(data);
      }
    };

    const handleBreakoutRoomLeft = (data: any) => {
      console.log('🚶 Flagship breakout room left:', data);
      fetchBreakoutRooms();
      if (data.participantId === currentUser.id) {
        setCurrentUserRoom(null);
        onLeaveRoom?.(data.roomId);
      }
    };

    const handleBreakoutRoomClosed = (data: any) => {
      console.log('🗑️ Flagship breakout room closed:', data);
      setBreakoutRooms(prev => prev.filter(room => room.id !== data.roomId));
      if (currentUserRoom === data.roomId) {
        setCurrentUserRoom(null);
        onLeaveRoom?.(data.roomId);
      }
      toast({
        title: "Room Closed",
        description: `"${data.roomName || 'Breakout room'}" was closed by ${data.closedBy}`,
        variant: "destructive",
        duration: 3000
      });
    };

    const handleAutoAssignmentCompleted = (data: any) => {
      console.log('🔄 Auto-assignment completed:', data);
      fetchBreakoutRooms();
      toast({
        title: "🎯 Auto-Assignment Complete",
        description: `${data.assignedCount} participants distributed to ${data.totalRooms} rooms`,
        duration: 4000
      });
    };

    // Enhanced event listeners
    socket.addEventListener('breakout_room_created', handleBreakoutRoomCreated);
    socket.addEventListener('breakout_room_joined', handleBreakoutRoomJoined);
    socket.addEventListener('breakout_room_left', handleBreakoutRoomLeft);
    socket.addEventListener('breakout_room_closed', handleBreakoutRoomClosed);
    socket.addEventListener('breakout_auto_assignment_completed', handleAutoAssignmentCompleted);

    return () => {
      socket.removeEventListener('breakout_room_created');
      socket.removeEventListener('breakout_room_joined');
      socket.removeEventListener('breakout_room_left');
      socket.removeEventListener('breakout_room_closed');
      socket.removeEventListener('breakout_auto_assignment_completed');
    };
  }, [socket.isConnected, sessionId, currentUserRoom, currentUser.id, toast, onJoinRoom, onLeaveRoom, fetchBreakoutRooms]);

  // Enhanced room creation
  const createBreakoutRoom = useCallback(async () => {
    if (!roomConfig.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a room name",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🎯 Creating flagship breakout room:', roomConfig);
      
      // Debug authentication before creating room
      const isAuthValid = await AuthDebugger.quickAuthCheck();
      if (!isAuthValid) {
        console.error('❌ Authentication check failed before room creation');
        await AuthDebugger.debugAuthenticationFlow(sessionId);
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // Use enhanced socket for real-time creation
      socket.createRoom(roomConfig);

      setIsCreateDialogOpen(false);
      setRoomConfig({
        name: '',
        topic: '',
        description: '',
        maxParticipants: 8,
        isPrivate: false,
        requiresApproval: false,
        allowTextChat: true,
        allowVoiceChat: true,
        allowScreenShare: false,
        moderationEnabled: true,
        recordingEnabled: false,
        autoClose: true,
        autoCloseAfterMinutes: 30,
        aiAssistance: true,
        smartMatching: false
      });
      
    } catch (error) {
      console.error('❌ Flagship breakout room creation failed:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Could not create breakout room",
        variant: "destructive"
      });
    }
  }, [roomConfig, socket, toast]);

  // Enhanced room joining
  const joinBreakoutRoom = useCallback(async (roomId: string) => {
    try {
      console.log('🚪 Joining flagship breakout room:', roomId);
      
      socket.joinRoom(roomId, {
        alias: currentUser.alias,
        avatarIndex: Math.floor(Math.random() * 8) + 1
      });

      setCurrentUserRoom(roomId);
      
    } catch (error) {
      console.error('❌ Flagship breakout room join failed:', error);
      toast({
        title: "Join Failed",
        description: error instanceof Error ? error.message : "Could not join breakout room",
        variant: "destructive"
      });
    }
  }, [socket, currentUser.alias]);

  // Auto-assign participants
  const autoAssignParticipants = useCallback(async () => {
    if (breakoutRooms.length === 0) {
      toast({
        title: "No Rooms Available",
        description: "Create breakout rooms first before auto-assigning",
        variant: "destructive"
      });
      return;
    }

    setIsAutoAssigning(true);
    
    try {
      console.log('🔄 Starting auto-assignment with enhanced auth...');
      
      const headers = getAuthHeaders();
      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms/auto-assign`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        await fetchBreakoutRooms();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to auto-assign');
      }
    } catch (error) {
      toast({
        title: "Auto-Assignment Failed",
        description: error instanceof Error ? error.message : "Could not distribute participants",
        variant: "destructive"
      });
    } finally {
      setIsAutoAssigning(false);
    }
  }, [breakoutRooms.length, sessionId, fetchBreakoutRooms, toast]);

  // Computed values
  const totalParticipantsInRooms = useMemo(() => {
    return breakoutRooms.reduce((sum, room) => sum + room.currentParticipants, 0);
  }, [breakoutRooms]);

  const unassignedParticipants = useMemo(() => {
    const assignedIds = new Set();
    breakoutRooms.forEach(room => {
      room.participants.forEach(p => assignedIds.add(p.id));
    });
    return participants.filter(p => !assignedIds.has(p.id) && !p.isHost);
  }, [breakoutRooms, participants]);

  const canManageRooms = currentUser.isHost || currentUser.isModerator;

  // Render room card
  const renderRoomCard = (room: BreakoutRoom) => (
    <motion.div
      key={room.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "relative transition-all duration-300 hover:shadow-lg",
        currentUserRoom === room.id && "ring-2 ring-primary bg-primary/5"
      )}
    >
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="font-semibold text-lg">{room.name}</h4>
                {room.isPrivate && <Lock className="h-4 w-4 text-amber-500" />}
                {room.settings.recordingEnabled && <Video className="h-4 w-4 text-red-500" />}
                {room.settings.moderationEnabled && <Shield className="h-4 w-4 text-blue-500" />}
              </div>
              
              {room.topic && (
                <p className="text-sm text-muted-foreground mb-2">{room.topic}</p>
              )}
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{room.currentParticipants}/{room.maxParticipants}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Crown className="h-3 w-3" />
                  <span>Host: {room.participants.find(p => p.role === 'facilitator')?.alias || 'Unknown'}</span>
                </span>
                {room.aiInsights && (
                  <span className="flex items-center space-x-1">
                    <Brain className="h-3 w-3 text-purple-500" />
                    <span>{Math.round(room.aiInsights.engagementScore * 100)}% engaged</span>
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <div className="flex space-x-1">
                {currentUserRoom === room.id && (
                  <Badge variant="default" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
                <Badge 
                  variant={room.currentParticipants === room.maxParticipants ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {room.currentParticipants === room.maxParticipants ? "Full" : "Available"}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Participants Avatars */}
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {room.participants.slice(0, 4).map((participant, index) => (
                <Avatar key={participant.id} className="w-8 h-8 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {participant.alias.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {room.participants.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                  +{room.participants.length - 4}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {currentUserRoom === room.id ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setCurrentUserRoom(null);
                    onLeaveRoom?.(room.id);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Leave
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => joinBreakoutRoom(room.id)}
                  disabled={!room.canJoin || !!currentUserRoom}
                  className="hover:bg-primary hover:text-primary-foreground"
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Join
                </Button>
              )}
            </div>
          </div>
          
          {/* Room Features */}
          <div className="flex items-center space-x-2 mt-3 pt-3 border-t">
            {room.settings.allowVoiceChat && <Mic className="h-3 w-3 text-green-500" />}
            {room.settings.allowTextChat && <MessageSquare className="h-3 w-3 text-blue-500" />}
            {room.settings.allowScreenShare && <Share className="h-3 w-3 text-purple-500" />}
            {room.settings.recordingEnabled && <Video className="h-3 w-3 text-red-500" />}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <>
        <QuickAuthDebug />
        <div className="w-full flex items-center justify-center py-12">
          <LoginPrompt 
            title="Login Required for Breakout Rooms"
            message="You need to be logged in to create and manage breakout rooms."
            feature="breakout rooms"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <QuickAuthDebug />
      <Card className="w-full">
        <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Flagship Breakout Rooms</span>
            </div>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{breakoutRooms.length}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>{totalParticipantsInRooms} active</span>
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-2"
              >
                <Users2 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'analytics' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('analytics')}
                className="h-8 px-2"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
            
            {canManageRooms && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={autoAssignParticipants}
                  disabled={isAutoAssigning || breakoutRooms.length === 0 || unassignedParticipants.length === 0}
                  className="flex items-center space-x-1"
                >
                  <Shuffle className="h-4 w-4" />
                  <span>{isAutoAssigning ? 'Assigning...' : 'Auto-Assign'}</span>
                  {unassignedParticipants.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {unassignedParticipants.length}
                    </Badge>
                  )}
                </Button>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-1">
                      <Plus className="h-4 w-4" />
                      <span>Create Room</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto"
                    aria-describedby="create-room-description"
                  >
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span>Create Flagship Breakout Room</span>
                      </DialogTitle>
                      <DialogDescription id="create-room-description">
                        Design an innovative breakout room with advanced features and AI assistance.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="room-name">Room Name *</Label>
                          <Input
                            id="room-name"
                            value={roomConfig.name}
                            onChange={(e) => setRoomConfig(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter an engaging room name..."
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="room-topic">Topic (Optional)</Label>
                          <Input
                            id="room-topic"
                            value={roomConfig.topic}
                            onChange={(e) => setRoomConfig(prev => ({ ...prev, topic: e.target.value }))}
                            placeholder="What will you discuss?"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="room-description">Description (Optional)</Label>
                          <Textarea
                            id="room-description"
                            value={roomConfig.description}
                            onChange={(e) => setRoomConfig(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Provide context and goals for this breakout room..."
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      {/* Room Settings */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center space-x-2">
                          <Settings2 className="h-4 w-4" />
                          <span>Room Configuration</span>
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Max Participants</Label>
                            <Select
                              value={roomConfig.maxParticipants.toString()}
                              onValueChange={(value) => setRoomConfig(prev => ({ ...prev, maxParticipants: parseInt(value) }))}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[4, 6, 8, 10, 12, 15, 20].map(num => (
                                  <SelectItem key={num} value={num.toString()}>{num} people</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Auto-close Timer</Label>
                            <Select
                              value={roomConfig.autoCloseAfterMinutes.toString()}
                              onValueChange={(value) => setRoomConfig(prev => ({ ...prev, autoCloseAfterMinutes: parseInt(value) }))}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15 minutes</SelectItem>
                                <SelectItem value="30">30 minutes</SelectItem>
                                <SelectItem value="45">45 minutes</SelectItem>
                                <SelectItem value="60">1 hour</SelectItem>
                                <SelectItem value="90">1.5 hours</SelectItem>
                                <SelectItem value="120">2 hours</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      {/* Features */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center space-x-2">
                          <Zap className="h-4 w-4" />
                          <span>Features & Permissions</span>
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="h-4 w-4 text-blue-500" />
                              <Label>Text Chat</Label>
                            </div>
                            <Switch
                              checked={roomConfig.allowTextChat}
                              onCheckedChange={(checked) => setRoomConfig(prev => ({ ...prev, allowTextChat: checked }))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Mic className="h-4 w-4 text-green-500" />
                              <Label>Voice Chat</Label>
                            </div>
                            <Switch
                              checked={roomConfig.allowVoiceChat}
                              onCheckedChange={(checked) => setRoomConfig(prev => ({ ...prev, allowVoiceChat: checked }))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Share className="h-4 w-4 text-purple-500" />
                              <Label>Screen Share</Label>
                            </div>
                            <Switch
                              checked={roomConfig.allowScreenShare}
                              onCheckedChange={(checked) => setRoomConfig(prev => ({ ...prev, allowScreenShare: checked }))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Video className="h-4 w-4 text-red-500" />
                              <Label>Recording</Label>
                            </div>
                            <Switch
                              checked={roomConfig.recordingEnabled}
                              onCheckedChange={(checked) => setRoomConfig(prev => ({ ...prev, recordingEnabled: checked }))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4 text-blue-500" />
                              <Label>Moderation</Label>
                            </div>
                            <Switch
                              checked={roomConfig.moderationEnabled}
                              onCheckedChange={(checked) => setRoomConfig(prev => ({ ...prev, moderationEnabled: checked }))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Lock className="h-4 w-4 text-amber-500" />
                              <Label>Private Room</Label>
                            </div>
                            <Switch
                              checked={roomConfig.isPrivate}
                              onCheckedChange={(checked) => setRoomConfig(prev => ({ ...prev, isPrivate: checked }))}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* AI Features */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center space-x-2">
                          <Brain className="h-4 w-4 text-purple-500" />
                          <span>AI-Powered Features</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Lightbulb className="h-4 w-4 text-yellow-500" />
                              <div>
                                <Label>AI Assistance</Label>
                                <p className="text-xs text-muted-foreground">Real-time insights and suggestions</p>
                              </div>
                            </div>
                            <Switch
                              checked={roomConfig.aiAssistance}
                              onCheckedChange={(checked) => setRoomConfig(prev => ({ ...prev, aiAssistance: checked }))}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Target className="h-4 w-4 text-green-500" />
                              <div>
                                <Label>Smart Matching</Label>
                                <p className="text-xs text-muted-foreground">AI-powered participant matching</p>
                              </div>
                            </div>
                            <Switch
                              checked={roomConfig.smartMatching}
                              onCheckedChange={(checked) => setRoomConfig(prev => ({ ...prev, smartMatching: checked }))}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={createBreakoutRoom} className="flex items-center space-x-1">
                          <Sparkles className="h-4 w-4" />
                          <span>Create Flagship Room</span>
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading flagship breakout rooms...</p>
          </div>
        ) : breakoutRooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <Sparkles className="h-16 w-16 mx-auto text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Breakout Rooms Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create innovative breakout rooms for focused discussions and collaboration
            </p>
            {canManageRooms && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center space-x-1">
                <Plus className="h-4 w-4" />
                <span>Create Your First Room</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Analytics View */}
            {viewMode === 'analytics' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Total Participants</p>
                        <p className="text-2xl font-bold">{totalParticipantsInRooms}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Active Rooms</p>
                        <p className="text-2xl font-bold">{breakoutRooms.filter(r => r.currentParticipants > 0).length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">Unassigned</p>
                        <p className="text-2xl font-bold">{unassignedParticipants.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {breakoutRooms.map(renderRoomCard)}
              </AnimatePresence>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
};
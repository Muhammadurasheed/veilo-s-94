/**
 * 🎯 FLAGSHIP BREAKOUT ROOM MANAGER
 * World-class breakout room management with real-time synchronization
 * Designed to surpass FAANG-level excellence
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useFlagshipBreakoutRoom } from '@/hooks/useFlagshipBreakoutRoom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthDebugPanel } from '@/components/debug/AuthDebugPanel';
import { 
  Users, 
  Plus, 
  ArrowRight, 
  X,
  Shuffle,
  Clock,
  AlertTriangle,
  Target,
  Mic,
  MicOff,
  Volume2,
  Settings,
  Crown,
  UserCheck,
  Loader2,
  CheckCircle,
  AlertCircle,
  Grid3X3,
  Bug
} from 'lucide-react';

interface BreakoutRoom {
  id: string;
  name: string;
  topic?: string;
  facilitatorId: string;
  facilitatorAlias: string;
  participants: Array<{
    id: string;
    alias: string;
    avatarIndex: number;
    isMuted: boolean;
    isConnected: boolean;
    joinedAt: string;
  }>;
  maxParticipants: number;
  status: 'active' | 'waiting' | 'ended';
  duration?: number;
  createdAt: string;
  agoraChannelName: string;
  settings: {
    allowTextChat: boolean;
    allowVoiceChat: boolean;
    allowScreenShare: boolean;
    moderationEnabled: boolean;
  };
}

interface FlagshipBreakoutRoomManagerProps {
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
  onJoinRoom?: (roomId: string) => void;
  onLeaveRoom?: (roomId: string) => void;
}

export const FlagshipBreakoutRoomManager: React.FC<FlagshipBreakoutRoomManagerProps> = ({
  sessionId,
  currentUser,
  participants,
  onJoinRoom,
  onLeaveRoom
}) => {
  const { toast } = useToast();
  
  // Use flagship breakout room hook
  const {
    rooms: breakoutRooms,
    currentRoom: currentUserRoom,
    isLoading,
    isCreating,
    connectionStatus,
    createRoom,
    joinRoom,
    leaveRoom,
    deleteRoom,
    autoAssignParticipants: autoAssign,
    metrics
  } = useFlagshipBreakoutRoom({ sessionId });
  
  // Local state for UI
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [showAuthDebug, setShowAuthDebug] = useState(false);
  
  // Form state
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomTopic, setNewRoomTopic] = useState('');
  const [newRoomMaxParticipants, setNewRoomMaxParticipants] = useState(6);
  const [newRoomDuration, setNewRoomDuration] = useState(15);
  const [selectedFacilitator, setSelectedFacilitator] = useState<string>('');
  
  // Refs for preventing duplicate operations
  const isInitialized = useRef(false);
  const roomCreationInProgress = useRef(false);

  // Handle room join/leave callbacks
  useEffect(() => {
    if (currentUserRoom) {
      onJoinRoom?.(currentUserRoom);
    }
  }, [currentUserRoom, onJoinRoom]);



  // Create breakout room with enhanced validation and feedback
  const createBreakoutRoom = useCallback(async () => {
    if (roomCreationInProgress.current) {
      console.log('⚠️ Room creation already in progress, ignoring duplicate request');
      return;
    }

    if (!newRoomName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a room name",
        variant: "destructive"
      });
      return;
    }

    if (newRoomName.trim().length < 2) {
      toast({
        title: "Name Too Short",
        description: "Room name must be at least 2 characters",
        variant: "destructive"
      });
      return;
    }

    roomCreationInProgress.current = true;

    try {
      console.log('🎯 Flagship: Creating breakout room...');
      
      const roomConfig = {
        name: newRoomName.trim(),
        topic: newRoomTopic?.trim(),
        maxParticipants: newRoomMaxParticipants,
        duration: newRoomDuration,
        facilitatorId: selectedFacilitator || currentUser.id,
        allowTextChat: true,
        allowVoiceChat: true,
        allowScreenShare: false,
        moderationEnabled: true,
        recordingEnabled: false,
        autoClose: true,
        autoCloseAfterMinutes: newRoomDuration
      };
      
      // Use flagship hook for room creation
      const success = await createRoom(roomConfig);
      
      if (success) {
        // Reset form immediately
        setIsCreateDialogOpen(false);
        resetCreateForm();
      }
      
    } catch (error) {
      console.error('❌ Flagship: Breakout room creation failed:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Could not create breakout room",
        variant: "destructive"
      });
    } finally {
      roomCreationInProgress.current = false;
    }
  }, [newRoomName, newRoomTopic, newRoomMaxParticipants, newRoomDuration, selectedFacilitator, currentUser.id, createRoom, toast]);

  // Reset form state
  const resetCreateForm = useCallback(() => {
    setNewRoomName('');
    setNewRoomTopic('');
    setNewRoomMaxParticipants(6);
    setNewRoomDuration(15);
    setSelectedFacilitator('');
  }, []);

  // Join breakout room with enhanced feedback
  const joinBreakoutRoom = useCallback(async (roomId: string) => {
    try {
      console.log('🚪 Flagship: Joining breakout room...');
      
      await joinRoom(roomId, {
        alias: currentUser.alias,
        avatarIndex: Math.floor(Math.random() * 8) + 1
      });
      
    } catch (error) {
      console.error('❌ Flagship: Join failed:', error);
    }
  }, [joinRoom, currentUser.alias]);

  // Leave breakout room
  const leaveBreakoutRoom = useCallback(async (roomId: string) => {
    try {
      console.log('🚶 Flagship: Leaving breakout room...');
      
      await leaveRoom(roomId);
      onLeaveRoom?.(roomId);
      
    } catch (error) {
      console.error('❌ Flagship: Leave failed:', error);
    }
  }, [leaveRoom, onLeaveRoom]);

  // Auto-assign participants
  const autoAssignParticipants = useCallback(async () => {
    if (breakoutRooms.length === 0) {
      toast({
        title: "No Rooms Available",
        description: "Create breakout rooms first",
        variant: "destructive"
      });
      return;
    }

    setIsAutoAssigning(true);
    
    try {
      console.log('🔄 Flagship: Auto-assigning participants...');
      
      const success = await autoAssign();
      
      if (!success) {
        setIsAutoAssigning(false);
      }
    } catch (error) {
      console.error('❌ Flagship: Auto-assignment failed:', error);
      setIsAutoAssigning(false);
    }
  }, [breakoutRooms.length, autoAssign, toast]);

  // Delete breakout room
  const deleteBreakoutRoom = useCallback(async (roomId: string) => {
    try {
      console.log('🗑️ Flagship: Deleting breakout room...');
      
      await deleteRoom(roomId);
      
    } catch (error) {
      console.error('❌ Flagship: Delete failed:', error);
    }
  }, [deleteRoom]);

  const availableFacilitators = participants.filter(p => !p.isHost);

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center space-x-2 text-xs">
      <div className={`w-2 h-2 rounded-full ${
        connectionStatus === 'connected' ? 'bg-green-500' : 
        connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
        'bg-red-500'
      }`} />
      <span className="text-muted-foreground">
        {connectionStatus === 'connected' ? 'Real-time active' : 
         connectionStatus === 'connecting' ? 'Connecting...' : 
         'Disconnected'}
      </span>
    </div>
  );

  return (
    <>
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Grid3X3 className="h-5 w-5" />
            <span>Flagship Breakout Rooms</span>
            <Badge variant="secondary">{breakoutRooms.length}</Badge>
            <ConnectionStatus />
          </div>
          
          {(currentUser.isHost || currentUser.isModerator) ? (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={autoAssignParticipants}
                disabled={isAutoAssigning || breakoutRooms.length === 0}
              >
                {isAutoAssigning ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Shuffle className="h-4 w-4 mr-1" />
                )}
                Auto-Assign
              </Button>
              
              {/* Debug buttons for development */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAuthDebug(true)}
                    title="Debug Authentication"
                  >
                    <Bug className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const { runBreakoutAuthDiagnostics } = await import('@/utils/debugBreakoutAuth');
                      const { debugSessionPermissions } = await import('@/utils/sessionPermissions');
                      
                      console.log('🚀 Running comprehensive diagnostics...');
                      await runBreakoutAuthDiagnostics(sessionId);
                      await debugSessionPermissions(sessionId);
                    }}
                    title="Run Complete Diagnostics"
                  >
                    🧪
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const { runDeploymentTests } = await import('@/utils/deploymentTest');
                      await runDeploymentTests();
                    }}
                    title="Test Backend Connection"
                  >
                    🔗
                  </Button>
                </>
              )}
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={isCreating}>
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    Create Room
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Flagship Breakout Room</DialogTitle>
                    <DialogDescription>
                      Create a focused discussion space for participants to collaborate in smaller groups with real-time synchronization.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Room Name *</label>
                      <Input
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="Enter room name..."
                        maxLength={50}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Topic (Optional)</label>
                      <Input
                        value={newRoomTopic}
                        onChange={(e) => setNewRoomTopic(e.target.value)}
                        placeholder="What will be discussed..."
                        maxLength={100}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Max Participants</label>
                        <Select
                          value={newRoomMaxParticipants.toString()}
                          onValueChange={(value) => setNewRoomMaxParticipants(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2, 3, 4, 5, 6, 8, 10, 12].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Duration (min)</label>
                        <Select
                          value={newRoomDuration.toString()}
                          onValueChange={(value) => setNewRoomDuration(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 15, 20, 30, 45, 60].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num} min</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Facilitator</label>
                      <Select value={selectedFacilitator} onValueChange={setSelectedFacilitator}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose facilitator..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={currentUser.id}>
                            <div className="flex items-center space-x-2">
                              <Crown className="h-3 w-3" />
                              <span>{currentUser.alias} (You)</span>
                            </div>
                          </SelectItem>
                          {availableFacilitators.map(participant => (
                            <SelectItem key={participant.id} value={participant.id}>
                              <div className="flex items-center space-x-2">
                                <UserCheck className="h-3 w-3" />
                                <span>{participant.alias}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        disabled={isCreating}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={createBreakoutRoom}
                        disabled={isCreating || !newRoomName.trim()}
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Create Room
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Only hosts and moderators can create breakout rooms</span>
              
              {/* Debug button for development even for non-hosts */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const { debugSessionPermissions } = await import('@/utils/sessionPermissions');
                    await debugSessionPermissions(sessionId);
                  }}
                  title="Debug Permissions"
                >
                  🔍
                </Button>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {breakoutRooms.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 text-muted-foreground"
          >
            <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No breakout rooms created yet</p>
            <p className="text-sm">Create rooms for focused discussions</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {breakoutRooms.map((room) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="relative border-l-4 border-l-primary/20 hover:border-l-primary/40 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <h4 className="font-medium flex items-center space-x-2">
                                <span>{room.name}</span>
                                <Badge 
                                  variant={room.status === 'active' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {room.status}
                                </Badge>
                                {room.facilitatorId === currentUser.id && (
                                  <Crown className="h-3 w-3 text-yellow-500" />
                                )}
                              </h4>
                              {room.topic && (
                                <p className="text-sm text-muted-foreground mt-1">{room.topic}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <Users className="h-3 w-3" />
                                  <span>{room.participants.length}/{room.maxParticipants}</span>
                                </span>
                                {room.duration && (
                                  <span className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{room.duration}min</span>
                                  </span>
                                )}
                                <span className="flex items-center space-x-1">
                                  <Target className="h-3 w-3" />
                                  <span>Facilitator: {room.facilitatorAlias}</span>
                                </span>
                              </div>
                            </div>
                            
                            {/* Participants Avatars */}
                            <div className="flex -space-x-2">
                              {room.participants.slice(0, 3).map((participant, index) => (
                                <Avatar key={participant.id} className="w-8 h-8 border-2 border-background">
                                  <AvatarFallback className="text-xs">
                                    {participant.alias.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {room.participants.length > 3 && (
                                <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                                  +{room.participants.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {currentUserRoom === room.id ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => leaveBreakoutRoom(room.id)}
                            >
                              Leave Room
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => joinBreakoutRoom(room.id)}
                              disabled={room.participants.length >= room.maxParticipants}
                            >
                              <ArrowRight className="h-4 w-4 mr-1" />
                              Join
                            </Button>
                          )}
                          
                          {(currentUser.isHost || currentUser.isModerator) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBreakoutRoom(room.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
    
    {/* Auth Debug Panel */}
    <AuthDebugPanel 
      isVisible={showAuthDebug} 
      onClose={() => setShowAuthDebug(false)} 
    />
  </>
  );
};
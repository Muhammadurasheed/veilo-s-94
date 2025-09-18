import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Plus, 
  ArrowRight, 
  X,
  Shuffle,
  Clock,
  Target,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEnhancedSocket, useBreakoutRoom } from '@/hooks/useEnhancedSocket';
import { tokenManager } from '@/services/tokenManager';

interface BreakoutRoom {
  id: string;
  name: string;
  createdBy: string;
  creatorAlias: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: Array<{
    id: string;
    alias: string;
    avatarIndex: number;
    joinedAt: string;
  }>;
  status: 'active' | 'closed';
  agoraChannelName: string;
  agoraToken: string;
  createdAt: string;
  canJoin: boolean;
}

interface WorkingBreakoutManagerProps {
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

export const WorkingBreakoutManager: React.FC<WorkingBreakoutManagerProps> = ({
  sessionId,
  currentUser,
  participants,
  onJoinRoom,
  onLeaveRoom
}) => {
  const { toast } = useToast();
  const socket = useBreakoutRoom(sessionId);
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMaxParticipants, setNewRoomMaxParticipants] = useState(10);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [currentUserRoom, setCurrentUserRoom] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch existing breakout rooms
  useEffect(() => {
    fetchBreakoutRooms();
  }, [sessionId]);

  // Listen for real-time breakout room updates with enhanced socket
  useEffect(() => {
    if (!socket.isConnected || !sessionId) return;

    const handleBreakoutRoomCreated = (data: any) => {
      console.log('🏠 Breakout room created event:', data);
      setBreakoutRooms(prev => [...prev, data.room]);
      toast({
        title: "New Breakout Room",
        description: `"${data.room?.name}" created by ${data.createdBy}`,
        duration: 3000
      });
    };

    const handleBreakoutRoomJoined = (data: any) => {
      console.log('🚪 Breakout room joined event:', data);
      fetchBreakoutRooms(); // Refresh room data
    };

    const handleBreakoutRoomLeft = (data: any) => {
      console.log('🚶 Breakout room left event:', data);
      fetchBreakoutRooms(); // Refresh room data
    };

    const handleBreakoutRoomClosed = (data: any) => {
      console.log('🗑️ Breakout room closed event:', data);
      setBreakoutRooms(prev => prev.filter(room => room.id !== data.roomId));
      if (currentUserRoom === data.roomId) {
        setCurrentUserRoom(null);
        onLeaveRoom?.(data.roomId);
      }
      toast({
        title: "Room Closed",
        description: `Breakout room closed by ${data.closedBy}`,
        variant: "destructive",
        duration: 3000
      });
    };

    const handleAutoAssignmentCompleted = (data: any) => {
      console.log('🔄 Auto-assignment completed:', data);
      fetchBreakoutRooms(); // Refresh room data
      toast({
        title: "Auto-Assignment Complete",
        description: `${data.assignedCount} participants distributed to ${data.totalRooms} rooms`,
        duration: 3000
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
  }, [socket.isConnected, sessionId, currentUserRoom, toast, onLeaveRoom]);

  const getAuthHeaders = () => {
    const token = tokenManager.getToken();
    
    console.log('🔐 Getting auth headers via tokenManager:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    if (!token) {
      console.error('❌ No authentication token found via tokenManager');
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    return {
      'Content-Type': 'application/json',
      ...tokenManager.getAuthHeaders()
    };
  };

  const fetchBreakoutRooms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms`, {
        headers: getAuthHeaders()
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
        console.error('Failed to fetch breakout rooms:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch breakout rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBreakoutRoom = async () => {
    if (!newRoomName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a room name",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🏠 Creating breakout room via enhanced socket...');
      
      // Use enhanced socket for real-time creation
      socket.createRoom({
        name: newRoomName.trim(),
        maxParticipants: newRoomMaxParticipants,
        allowTextChat: true,
        allowVoiceChat: true,
        allowScreenShare: false,
        moderationEnabled: true,
        recordingEnabled: false,
        autoClose: true,
        autoCloseAfterMinutes: 30
      });

      setIsCreateDialogOpen(false);
      resetCreateForm();
      
      // Success toast will be shown by the event handler
      
    } catch (error) {
      console.error('❌ Enhanced breakout room creation failed:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Could not create breakout room",
        variant: "destructive"
      });
    }
  };

  const resetCreateForm = () => {
    setNewRoomName('');
    setNewRoomMaxParticipants(10);
  };

  const joinBreakoutRoom = async (roomId: string) => {
    try {
      console.log('🚪 Joining breakout room via enhanced socket:', roomId);
      
      // Use enhanced socket for real-time joining
      socket.joinRoom(roomId, {
        alias: currentUser.alias,
        avatarIndex: Math.floor(Math.random() * 8) + 1
      });

      setCurrentUserRoom(roomId);
      
      // Success handling will be done by the event listener
      
    } catch (error) {
      console.error('❌ Enhanced breakout room join failed:', error);
      toast({
        title: "Join Failed",
        description: error instanceof Error ? error.message : "Could not join breakout room",
        variant: "destructive"
      });
    }
  };

  const leaveBreakoutRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms/${roomId}/leave`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setCurrentUserRoom(null);
        onLeaveRoom?.(roomId);
        
        toast({
          title: "Left Room",
          description: "You've returned to the main session"
        });
        
        await fetchBreakoutRooms();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to leave room');
      }
    } catch (error) {
      toast({
        title: "Leave Failed",
        description: error instanceof Error ? error.message : "Could not leave breakout room",
        variant: "destructive"
      });
    }
  };

  const autoAssignParticipants = async () => {
    if (breakoutRooms.length === 0) {
      toast({
        title: "No Rooms",
        description: "Create breakout rooms first",
        variant: "destructive"
      });
      return;
    }

    setIsAutoAssigning(true);
    
    try {
      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms/auto-assign`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        await fetchBreakoutRooms();
        toast({
          title: "Auto-Assignment Complete",
          description: "Participants have been distributed to rooms"
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to auto-assign');
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
  };

  const deleteBreakoutRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms/${roomId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setBreakoutRooms(prev => prev.filter(room => room.id !== roomId));
        if (currentUserRoom === roomId) {
          setCurrentUserRoom(null);
        }
        
        toast({
          title: "Room Closed",
          description: "Breakout room has been closed"
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to close room');
      }
    } catch (error) {
      toast({
        title: "Close Failed",
        description: error instanceof Error ? error.message : "Could not close breakout room",
        variant: "destructive"
      });
    }
  };

  const canManageRooms = currentUser.isHost || currentUser.isModerator;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Breakout Rooms</span>
            <Badge variant="secondary">{breakoutRooms.length}</Badge>
          </div>
          
          {canManageRooms && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={autoAssignParticipants}
                disabled={isAutoAssigning || breakoutRooms.length === 0}
              >
                <Shuffle className="h-4 w-4 mr-1" />
                {isAutoAssigning ? 'Assigning...' : 'Auto-Assign'}
              </Button>
              
              <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Manage Breakout Rooms</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Active Rooms</h4>
                      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Create Room
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Breakout Room</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Room Name</label>
                              <Input
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                placeholder="Enter room name..."
                              />
                            </div>
                            
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
                                  {[4, 6, 8, 10, 12, 15, 20].map(num => (
                                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex justify-end space-x-2 pt-4">
                              <Button
                                variant="outline"
                                onClick={() => setIsCreateDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button onClick={createBreakoutRoom}>
                                Create Room
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {breakoutRooms.map((room) => (
                        <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{room.name}</span>
                              <Badge variant={room.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {room.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {room.currentParticipants}/{room.maxParticipants} participants
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBreakoutRoom(room.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {breakoutRooms.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No breakout rooms created yet</p>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading breakout rooms...</p>
          </div>
        ) : breakoutRooms.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No breakout rooms available</p>
            <p className="text-sm">Host can create rooms for focused discussions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {breakoutRooms.map((room) => (
              <Card key={room.id} className={cn(
                "relative transition-all duration-200",
                currentUserRoom === room.id && "ring-2 ring-primary bg-primary/5"
              )}>
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
                            {currentUserRoom === room.id && (
                              <Badge variant="outline" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </h4>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{room.currentParticipants}/{room.maxParticipants}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Target className="h-3 w-3" />
                              <span>Created by: {room.creatorAlias}</span>
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
                          disabled={!room.canJoin || !!currentUserRoom}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
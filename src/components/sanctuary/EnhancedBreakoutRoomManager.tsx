import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { tokenManager } from '@/services/tokenManager';
import { useBreakoutRoom } from '@/hooks/useEnhancedSocket';
import { 
  Users, 
  Plus, 
  Settings, 
  ArrowRight, 
  Volume2, 
  VolumeX,
  MoreHorizontal,
  X,
  Shuffle,
  Clock,
  Target
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
  }>;
  maxParticipants: number;
  status: 'active' | 'waiting' | 'ended';
  duration?: number; // in minutes
  createdAt: string;
  agoraChannelName: string;
}

interface EnhancedBreakoutRoomManagerProps {
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

export const EnhancedBreakoutRoomManager: React.FC<EnhancedBreakoutRoomManagerProps> = ({
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
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomTopic, setNewRoomTopic] = useState('');
  const [newRoomMaxParticipants, setNewRoomMaxParticipants] = useState(6);
  const [newRoomDuration, setNewRoomDuration] = useState(15);
  const [selectedFacilitator, setSelectedFacilitator] = useState<string>('');
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [currentUserRoom, setCurrentUserRoom] = useState<string | null>(null);

  // Fetch existing breakout rooms
  useEffect(() => {
    fetchBreakoutRooms();
  }, [sessionId]);

  // Enhanced socket event listeners
  useEffect(() => {
    if (!socket.isConnected || !sessionId) return;

    const handleBreakoutRoomCreated = (data: any) => {
      console.log('🏠 Enhanced breakout room created:', data);
      setBreakoutRooms(prev => [...prev, data.room]);
      toast({
        title: "🎉 Room Created Successfully",
        description: `"${data.room?.name}" is now available for participants`,
        duration: 4000
      });
    };

    const handleBreakoutRoomJoined = (data: any) => {
      console.log('🚪 Enhanced breakout room joined:', data);
      fetchBreakoutRooms(); // Refresh room data
    };

    const handleBreakoutRoomLeft = (data: any) => {
      console.log('🚶 Enhanced breakout room left:', data);
      fetchBreakoutRooms(); // Refresh room data
    };

    const handleBreakoutRoomClosed = (data: any) => {
      console.log('🗑️ Enhanced breakout room closed:', data);
      setBreakoutRooms(prev => prev.filter(room => room.id !== data.roomId));
      toast({
        title: "Room Closed",
        description: `Breakout room was closed by ${data.closedBy}`,
        variant: "destructive",
        duration: 3000
      });
    };

    // Add enhanced event listeners
    socket.addEventListener('breakout_room_created', handleBreakoutRoomCreated);
    socket.addEventListener('breakout_room_joined', handleBreakoutRoomJoined);
    socket.addEventListener('breakout_room_left', handleBreakoutRoomLeft);
    socket.addEventListener('breakout_room_closed', handleBreakoutRoomClosed);

    return () => {
      socket.removeEventListener('breakout_room_created');
      socket.removeEventListener('breakout_room_joined');
      socket.removeEventListener('breakout_room_left');
      socket.removeEventListener('breakout_room_closed');
    };
  }, [socket.isConnected, sessionId, toast]);

  const fetchBreakoutRooms = async () => {
    try {
      // Use enhanced authentication headers
      const headers = {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeaders()
      };
      
      console.log('📋 Fetching breakout rooms with enhanced auth...');
      
      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setBreakoutRooms(data.data?.rooms || data.rooms || []);
        console.log('✅ Breakout rooms fetched successfully:', data.data?.rooms?.length || 0);
      } else {
        console.error('❌ Failed to fetch breakout rooms:', response.status, response.statusText);
        
        // Enhanced debugging for 401 errors
        if (response.status === 401) {
          console.error('🚨 401 Unauthorized - Authentication failed for breakout rooms fetch');
          const token = tokenManager.getToken();
          console.log('🔍 Token debug:', {
            hasToken: !!token,
            tokenLength: token ? token.length : 0,
            headers: Object.keys(headers)
          });
        }
      }
    } catch (error) {
      console.error('❌ Network error fetching breakout rooms:', error);
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
      console.log('🎯 Creating breakout room via enhanced socket system...');
      
      // Use enhanced socket system for room creation (no HTTP API call needed)
      socket.createRoom({
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
      });
      
      // Reset form immediately (success toast will come from socket event)
      setIsCreateDialogOpen(false);
      resetCreateForm();
      
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
    setNewRoomTopic('');
    setNewRoomMaxParticipants(6);
    setNewRoomDuration(15);
    setSelectedFacilitator('');
  };

  const joinBreakoutRoom = async (roomId: string) => {
    try {
      console.log('🚪 Joining breakout room via enhanced socket system...');
      
      // Use enhanced socket system instead of HTTP API
      socket.joinRoom(roomId, {
        alias: currentUser.alias,
        avatarIndex: Math.floor(Math.random() * 8) + 1
      });

      setCurrentUserRoom(roomId);
      onJoinRoom?.(roomId);
      
      // Success handling will be done by socket event listeners
      toast({
        title: "Joining Room",
        description: "Connecting to breakout room..."
      });
      
    } catch (error) {
      toast({
        title: "Join Failed",
        description: "Could not join breakout room",
        variant: "destructive"
      });
    }
  };

  const leaveBreakoutRoom = async (roomId: string) => {
    try {
      console.log('🚶 Leaving breakout room...');
      
      // For leaving, we can just update the UI immediately
      // The socket system will handle the backend cleanup
      setCurrentUserRoom(null);
      onLeaveRoom?.(roomId);
      
      toast({
        title: "Left Room",
        description: "You've returned to the main session"
      });
      
      await fetchBreakoutRooms();
    } catch (error) {
      toast({
        title: "Leave Failed",
        description: "Could not leave breakout room",
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
      // Use enhanced authentication headers
      const headers = {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeaders()
      };
      
      console.log('🔄 Auto-assigning with enhanced auth...');
      
      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms/auto-assign`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        await fetchBreakoutRooms();
        toast({
          title: "Auto-Assignment Complete",
          description: "Participants have been distributed to rooms"
        });
      }
    } catch (error) {
      toast({
        title: "Auto-Assignment Failed",
        description: "Could not distribute participants",
        variant: "destructive"
      });
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const deleteBreakoutRoom = async (roomId: string) => {
    try {
      // Use enhanced authentication headers
      const headers = {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeaders()
      };
      
      console.log('🗑️ Deleting breakout room with enhanced auth...');
      
      const response = await fetch(`/api/flagship-sanctuary/${sessionId}/breakout-rooms/${roomId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        setBreakoutRooms(prev => prev.filter(room => room.id !== roomId));
        if (currentUserRoom === roomId) {
          setCurrentUserRoom(null);
        }
        
        toast({
          title: "Room Deleted",
          description: "Breakout room has been removed"
        });
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete breakout room",
        variant: "destructive"
      });
    }
  };

  const availableFacilitators = participants.filter(p => !p.isHost);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Breakout Rooms</span>
            <Badge variant="secondary">{breakoutRooms.length}</Badge>
          </div>
          
          {(currentUser.isHost || currentUser.isModerator) && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={autoAssignParticipants}
                disabled={isAutoAssigning || breakoutRooms.length === 0}
              >
                <Shuffle className="h-4 w-4 mr-1" />
                Auto-Assign
              </Button>
              
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
                    <DialogDescription>
                      Create a focused discussion space for participants to collaborate in smaller groups.
                    </DialogDescription>
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
                      <label className="block text-sm font-medium mb-2">Topic (Optional)</label>
                      <Input
                        value={newRoomTopic}
                        onChange={(e) => setNewRoomTopic(e.target.value)}
                        placeholder="What will be discussed..."
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
                            {currentUser.alias} (You)
                          </SelectItem>
                          {availableFacilitators.map(participant => (
                            <SelectItem key={participant.id} value={participant.id}>
                              {participant.alias}
                            </SelectItem>
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
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {breakoutRooms.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No breakout rooms created yet</p>
            <p className="text-sm">Create rooms for focused discussions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {breakoutRooms.map((room) => (
              <Card key={room.id} className="relative">
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
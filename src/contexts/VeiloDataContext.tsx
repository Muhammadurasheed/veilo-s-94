
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { postsService } from '@/services/apiService';  // Use new emergency-aware API service
import { useAuth } from '@/contexts/optimized/AuthContextRefactored';
import { Post, Expert } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useEmergencyMode } from '@/contexts/EmergencyModeContext';

interface VeiloDataContextType {
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  experts: Expert[];
  setExperts: (experts: Expert[]) => void;
  loading: {
    posts: boolean;
    experts: boolean;
  };
  refreshPosts: () => Promise<void>;
  refreshExperts: () => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  createPost: (content: string, feeling?: string, topic?: string, wantsExpertHelp?: boolean, attachments?: File[]) => Promise<Post | null>;
  addComment: (postId: string, content: string) => Promise<Post | null>;
  flagPost: (postId: string, reason: string) => Promise<boolean>;
}

const VeiloDataContext = createContext<VeiloDataContextType>({
  posts: [],
  setPosts: () => {},
  experts: [],
  setExperts: () => {},
  loading: {
    posts: false,
    experts: false,
  },
  refreshPosts: async () => {},
  refreshExperts: async () => {},
  likePost: async () => {},
  unlikePost: async () => {},
  createPost: async () => null,
  addComment: async () => null,
  flagPost: async () => false,
});

export const useVeiloData = () => useContext(VeiloDataContext);

export const VeiloDataProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState({
    posts: true,
    experts: true,
  });
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { isEmergencyMode, emergencyPosts, addEmergencyPost } = useEmergencyMode();

  // Fetch initial data
  useEffect(() => {
    // Always load posts and experts so anonymous users also see content
    refreshPosts();
    refreshExperts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshPosts = async () => {
    setLoading(prev => ({ ...prev, posts: true }));
    try {
      // Use the new emergency-aware API service
      const response = await postsService.getAll();
      
      if (response.success && response.data) {
        // Merge API posts with emergency posts if in emergency mode
        let allPosts = response.data;
        
        if (isEmergencyMode && emergencyPosts.length > 0) {
          // Add emergency posts at the top
          allPosts = [...emergencyPosts, ...allPosts];
          console.log(`📱 Emergency Mode: Showing ${emergencyPosts.length} offline posts`);
        }
        
        setPosts(allPosts);
        
        if (response.message === 'Loaded from offline storage') {
          toast({
            title: 'Offline Mode',
            description: 'Showing posts from offline storage',
            variant: 'default',
          });
        }
      } else {
        console.error('Failed to fetch posts:', response.error);
        
        // In emergency mode, still show emergency posts
        if (isEmergencyMode && emergencyPosts.length > 0) {
          setPosts(emergencyPosts);
          toast({
            title: 'Offline Mode',
            description: `Showing ${emergencyPosts.length} offline posts`,
            variant: 'default',
          });
        } else {
          toast({
            title: 'Error fetching posts',
            description: response.error || 'Backend server is unavailable',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      
      // In emergency mode, still show emergency posts  
      if (isEmergencyMode && emergencyPosts.length > 0) {
        setPosts(emergencyPosts);
      }
    } finally {
      setLoading(prev => ({ ...prev, posts: false }));
    }
  };

  const refreshExperts = async () => {
    setLoading(prev => ({ ...prev, experts: true }));
    try {
      // TODO: Update to use new API service when experts service is created
      // For now, just clear experts to avoid errors
      setExperts([]);
      console.log('📝 Experts API temporarily disabled - using emergency mode');
    } catch (error) {
      console.error('Error fetching experts:', error);
    } finally {
      setLoading(prev => ({ ...prev, experts: false }));
    }
  };

  const likePost = async (postId: string) => {
    if (!isAuthenticated || !user) return;
    
    try {
      // TODO: Implement like functionality with new API service
      console.log('📝 Like functionality temporarily disabled - using emergency mode');
      toast({
        title: 'Feature temporarily unavailable',
        description: 'Like functionality will be restored when server is online',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const unlikePost = async (postId: string) => {
    if (!isAuthenticated || !user) return;
    
    try {
      // TODO: Implement unlike functionality with new API service
      console.log('📝 Unlike functionality temporarily disabled - using emergency mode');
      toast({
        title: 'Feature temporarily unavailable', 
        description: 'Unlike functionality will be restored when server is online',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error unliking post:', error);
    }
  };

  const createPost = async (
    content: string, 
    feeling?: string, 
    topic?: string,
    wantsExpertHelp: boolean = false,
    attachments: File[] = []
  ): Promise<Post | null> => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create posts.",
        variant: "destructive",
      });
      return null;
    }
    
    try {
      console.log('🚀 Creating post with new API service...');
      
      // For now, use simple JSON until file upload is working
      const postData = {
        content,
        feeling,
        topic,
        wantsExpertHelp,
        authorId: user.id,
        anonymous: true // Veilo is anonymous by default
      };
      
      const response = await postsService.create(postData);
      
      if (response.success && response.data) {
        // Add the new post to the local state
        setPosts(prevPosts => [response.data, ...prevPosts]);
        
        // If this was an emergency creation, also add to emergency context
        if (response.data.isEmergencyMode) {
          addEmergencyPost(response.data);
          toast({
            title: 'Post saved offline',
            description: 'Your post will sync when the server is back online',
            variant: 'default',
          });
        } else {
          toast({
            title: 'Post created',
            description: 'Your post has been published successfully',
            variant: 'default',
          });
        }
        
        return response.data;
      } else {
        // Handle emergency mode creation failure
        if (response.error?.includes('HTML instead of JSON') || response.error?.includes('Backend server is unavailable')) {
          // The API service should have handled emergency storage
          console.log('📱 Post created in emergency mode');
          return null; // The emergency handler will have shown appropriate toast
        }
        
        toast({
          title: 'Failed to create post',
          description: response.error || 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    }
    
    return null;
  };

  const addComment = async (postId: string, content: string): Promise<Post | null> => {
    if (!isAuthenticated || !user) return null;
    
    try {
      // TODO: Implement comment functionality with new API service
      console.log('📝 Comment functionality temporarily disabled - using emergency mode');
      toast({
        title: 'Feature temporarily unavailable',
        description: 'Comments will be restored when server is online', 
        variant: 'default',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    }
    
    return null;
  };

  const flagPost = async (postId: string, reason: string): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;
    
    try {
      // TODO: Implement flag functionality with new API service
      console.log('📝 Flag functionality temporarily disabled - using emergency mode');
      toast({
        title: 'Feature temporarily unavailable',
        description: 'Post reporting will be restored when server is online',
        variant: 'default',
      });
      return false;
    } catch (error) {
      console.error('Error flagging post:', error);
      toast({
        title: 'Error',
        description: 'Failed to report post',
        variant: 'destructive',
      });
    }
    
    return false;
  };

  return (
    <VeiloDataContext.Provider
      value={{
        posts,
        setPosts,
        experts,
        setExperts,
        loading,
        refreshPosts,
        refreshExperts,
        likePost,
        unlikePost,
        createPost,
        addComment,
        flagPost,
      }}
    >
      {children}
    </VeiloDataContext.Provider>
  );
};

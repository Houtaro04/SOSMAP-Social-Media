import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { profileService, ensureFullUrl } from '@/shared/services/profileService';
import { rescueTaskService } from '@/shared/services/rescueTaskService';
import type { ProfileUpdateRequest } from '@/shared/entities/ProfileEntity';
import { VolunteerStats } from '@/shared/entities/VolunteerEntity';
import { RescueTaskEntity } from '@/shared/entities/RescueTaskEntity';
import { PostResponse, CommentResponse } from '@/shared/entities/PostEntity';
import { postService } from '@/shared/services/postService';

export function useVolunteerProfileViewModel(userId?: string) {
  const { user: authUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const [myPosts, setMyPosts] = useState<PostResponse[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostResponse | null>(null);
  const [postComments, setPostComments] = useState<CommentResponse[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'POSTS'>('HISTORY');

  useEffect(() => {
    if (userId) {
      loadOtherUserProfile(userId);
    } else {
      loadOwnProfile();
    }
  }, [userId]);

  const loadOtherUserProfile = async (uid: string) => {
    setIsLoading(true);
    try {
      const res = await profileService.getUserById(uid);
      if (res.data) {
        setProfile(res.data);
        const isTargetVolunteer = res.data.role === 'VOLUNTEER';

        // Fetch based on target role
        const [statsRes, historyRes] = await Promise.all([
          isTargetVolunteer ? profileService.getVolunteerStats(uid) : profileService.getStats(uid),
          isTargetVolunteer ? profileService.getVolunteerHistory(uid) : profileService.getHistory(uid)
        ]);

        setStats(statsRes.data);
        setHistory(historyRes.data || []);
        loadPosts(uid);
      }
    } catch (err) {
      console.error('Failed to load other user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOwnProfile = async () => {
    setIsLoading(true);
    try {
      const res = await profileService.getProfile();
      if (res.data) {
        setProfile(res.data);
        // Cập nhật store nếu là profile của chính mình
        updateUser({
          fullName: res.data.fullName,
          phone: res.data.phone,
          email: res.data.email,
          address: res.data.address,
          imageUrl: res.data.imageUrl
        });

        // Fetch stats & history (Volunteer role assumed for current user in this module)
        const [statsRes, historyRes] = await Promise.all([
          profileService.getVolunteerStats(res.data.id),
          profileService.getVolunteerHistory(res.data.id)
        ]);
        setStats(statsRes.data);
        setHistory(historyRes.data || []);
        loadPosts(res.data.id);
      }
    } catch (err) {
      console.error('Failed to load own profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async (uid: string) => {
    setIsPostsLoading(true);
    try {
      const res = await postService.getMyPosts(uid);
      setMyPosts(res.data);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setIsPostsLoading(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    try {
      const url = await profileService.uploadFile(file);
      return url;
    } catch (err) {
      console.error('[VolunteerProfile] Change avatar error:', err);
      throw err;
    }
  };

  const handleAvatarRemove = async () => {
    return '';
  };

  const handleUpdateProfile = async (data: ProfileUpdateRequest) => {
    try {
      const res = await profileService.updateProfile(data);
      if (res.data) {
        setProfile(res.data);
        updateUser({
          fullName: res.data.fullName,
          phone: res.data.phone,
          email: res.data.email,
          address: res.data.address,
          imageUrl: res.data.imageUrl
        });
      }
      return true;
    } catch (err) {
      console.error('[VolunteerProfile] Update profile error:', err);
      throw err;
    }
  };

  const loadPostComments = async (postId: string) => {
    setIsCommentsLoading(true);
    try {
      const res = await postService.getComments(postId);
      setPostComments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommentsLoading(false);
    }
  };

  const handleSelectPost = (post: PostResponse | null) => {
    setSelectedPost(post);
    if (post) {
      loadPostComments(post.id);
    } else {
      setPostComments([]);
    }
  };

  const handleAddCommentToPost = async (postId: string, content: string, parentId?: string) => {
    if (!content.trim()) return;
    try {
      const res = await postService.addComment({ postId, content, parentId });
      if (authUser) {
        res.data.userName = authUser.fullName;
        res.data.userAvatar = authUser.imageUrl || '';
      }
      if (parentId) res.data.parentId = parentId;

      setPostComments(prev => [...prev, res.data]);
      setMyPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, commentCount: p.commentCount + 1 } as PostResponse;
        }
        return p;
      }));
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
      await postService.deletePost(postId);
      setMyPosts(prev => prev.filter(p => p.id !== postId));
      setSelectedPost(null);
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Không thể xóa bài viết. Vui lòng thử lại sau.');
    }
  };

  const finalDisplayName = profile?.fullName || (userId ? 'Người dùng' : (authUser?.fullName || 'Người Cứu Hộ'));
  const finalDisplayEmail = profile?.email || (userId ? '' : (authUser?.email || 'Volunteer@sosmap.vn'));
  const finalAvatarUrl = ensureFullUrl(profile?.imageUrl || (userId ? '' : authUser?.imageUrl), finalDisplayName);

  return {
    user: profile,
    authUser,
    isLoading,
    stats,
    history,
    myPosts,
    isPostsLoading,
    selectedPost,
    postComments,
    isCommentsLoading,
    handleSelectPost,
    handleAddCommentToPost,
    handleDeletePost,
    isModalOpen,
    setIsModalOpen,
    activeTab,
    setActiveTab,
    handleAvatarChange,
    handleAvatarRemove,
    handleUpdateProfile,
    displayName: finalDisplayName,
    displayEmail: finalDisplayEmail,
    avatarUrl: finalAvatarUrl
  };
}


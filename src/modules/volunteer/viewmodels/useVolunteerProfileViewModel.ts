import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { profileService, ensureFullUrl } from '@/shared/services/profileService';
import { rescueTaskService } from '@/shared/services/rescueTaskService';
import type { ProfileUpdateRequest } from '@/shared/entities/ProfileEntity';
import { VolunteerStats } from '@/shared/entities/VolunteerEntity';
import { RescueTaskEntity } from '@/shared/entities/RescueTaskEntity';
import { PostResponse, CommentResponse } from '@/shared/entities/PostEntity';
import { postService } from '@/shared/services/postService';

export function useVolunteerProfileViewModel() {
  const { user, updateUser } = useAuthStore();
  const [stats, setStats] = useState<VolunteerStats>(new VolunteerStats());
  const [history, setHistory] = useState<RescueTaskEntity[]>([]);

  const [myPosts, setMyPosts] = useState<PostResponse[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostResponse | null>(null);
  const [postComments, setPostComments] = useState<CommentResponse[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'POSTS'>('HISTORY');

  useEffect(() => {
    loadProfileData();
    if (user?.id) {
      loadMyPosts(user.id);
    }
  }, [user?.id]);

  const loadMyPosts = async (userId: string) => {
    setIsPostsLoading(true);
    try {
      const res = await postService.getMyPosts(userId);
      setMyPosts(res.data);
    } catch (err) {
      console.error('Failed to load my posts:', err);
    } finally {
      setIsPostsLoading(false);
    }
  };

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      // 1. Load Profile
      const res = await profileService.getProfile();
      const u = res.data;
      if (u) {
        updateUser({
          fullName: u.fullName,
          phone: u.phone,
          email: u.email,
          address: u.address,
          imageUrl: u.imageUrl
        });
      }

      // 2. Load Rescue Tasks & Calc Stats
      if (user?.id) {
        const { data: tasks } = await rescueTaskService.getTasksByUserId(user.id);
        setHistory(tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

        const total = tasks.length;
        const success = tasks.filter(t => t.status === 'COMPLETED').length;
        
        // Tính số liệu hàng tuần (7 ngày qua)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const weeklyTasks = tasks.filter(t => new Date(t.createdAt) >= sevenDaysAgo && t.status === 'COMPLETED');

        setStats(new VolunteerStats({
          totalMissions: total,
          successMissions: success,
          totalHours: 0, // Tạm thời bỏ qua theo yêu cầu người dùng
          weeklyCompleted: weeklyTasks.length,
          weeklyHelped: weeklyTasks.length, // Giả định mỗi task giúp 1 người
          weeklyRating: 5.0, // Giả lập đánh giá cao
          avgRating: 0
        }));
      }
    } catch (err) {
      console.error('[VolunteerProfileViewModel] loadProfileData error:', err);
    } finally {
      setIsLoading(false);
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
      if (user) {
        res.data.userName = user.fullName;
        res.data.userAvatar = user.imageUrl || '';
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

  const displayName = user?.fullName || 'Người Cứu Hộ';
  const displayEmail = user?.email || 'Volunteer@sosmap.vn';
  const avatarUrl = ensureFullUrl(user?.imageUrl, displayName);

  return {
    user,
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
    displayName,
    displayEmail,
    avatarUrl
  };
}

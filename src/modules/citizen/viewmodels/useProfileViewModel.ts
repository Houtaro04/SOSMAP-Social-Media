import { useState, useEffect } from 'react';
import { ProfileResponse, ProfileUpdateRequest, SosStatsResponse, SosHistoryItemResponse } from '@/shared/entities/ProfileEntity';
import { PostResponse, CommentResponse } from '@/shared/entities/PostEntity';
import { profileService } from '@/shared/services/profileService';
import { postService } from '@/shared/services/postService';
import { useAuthStore } from '@/store/authStore';

export function useProfileViewModel() {
  const { user: authUser, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [stats, setStats] = useState<SosStatsResponse | null>(null);
  const [history, setHistory] = useState<SosHistoryItemResponse[]>([]);
  const [myPosts, setMyPosts] = useState<PostResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'POSTS'>('HISTORY');

  const [selectedPost, setSelectedPost] = useState<PostResponse | null>(null);
  const [postComments, setPostComments] = useState<CommentResponse[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<ProfileUpdateRequest>(new ProfileUpdateRequest({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    imageUrl: ''
  }));

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, statsRes, historyRes] = await Promise.all([
        profileService.getProfile(),
        profileService.getStats(),
        profileService.getHistory()
      ]);

      const profileDetail = profileRes.data;
      setProfile(profileDetail);
      setStats(statsRes.data);
      setHistory(historyRes.data);

      if (profileDetail.id) {
        loadMyPosts(profileDetail.id);
      } else if (authUser?.id) {
        loadMyPosts(authUser.id);
      }

      // Cập nhật lên global store
      updateUser({
        fullName: profileDetail.fullName,
        phone: profileDetail.phone,
        email: profileDetail.email,
        address: profileDetail.address,
        imageUrl: profileDetail.imageUrl
      });

      setFormData(new ProfileUpdateRequest({
        fullName: profileDetail.fullName || '',
        phone: profileDetail.phone || '',
        email: profileDetail.email || '',
        address: profileDetail.address || '',
        imageUrl: profileDetail.imageUrl || ''
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    setIsSaving(true);
    try {
      const url = await profileService.uploadFile(file);
      setFormData(prev => new ProfileUpdateRequest({ ...prev, imageUrl: url }));
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Không thể tải ảnh lên.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarRemove = () => {
    setFormData(prev => new ProfileUpdateRequest({ ...prev, imageUrl: '' }));
  };

  const handleInputChange = (field: keyof ProfileUpdateRequest, value: string) => {
    setFormData(prev => new ProfileUpdateRequest({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await profileService.updateProfile(formData);
      setProfile(res.data);

      // Cập nhật lên global store
      updateUser({
        fullName: res.data.fullName,
        phone: res.data.phone,
        email: res.data.email,
        address: res.data.address,
        imageUrl: res.data.imageUrl
      });

      setMessage({ type: 'success', text: res.message });
      // Go back to dashboard on success
      setTimeout(() => {
        setMessage(null);
        setIsEditing(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Lỗi hệ thống.' });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    if (profile) {
      setFormData(new ProfileUpdateRequest({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        email: profile.email || '',
        address: profile.address || '',
        imageUrl: profile.imageUrl || ''
      }));
    }
    setMessage(null);
    setIsEditing(false);
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

  const handleAddComment = async (postId: string, content: string, parentId?: string) => {
    if (!content.trim()) return;
    try {
      const res = await postService.addComment({ postId, content, parentId });
      
      // Enrich with user info
      if (authUser) {
        res.data.userName = authUser.fullName;
        res.data.userAvatar = authUser.imageUrl || '';
      }
      if (parentId) res.data.parentId = parentId;

      setPostComments(prev => [...prev, res.data]);
      
      // Update comment count in myPosts
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

  return {
    profile,
    stats,
    history,
    myPosts,
    activeTab,
    setActiveTab,
    selectedPost,
    postComments,
    isCommentsLoading,
    handleSelectPost,
    handleAddComment,
    handleDeletePost,
    isLoading,
    isPostsLoading,
    isEditing,
    setIsEditing,
    isSaving,
    formData,
    handleInputChange,
    saveProfile,
    cancelEdit,
    handleAvatarChange,
    handleAvatarRemove,
    message
  };
}

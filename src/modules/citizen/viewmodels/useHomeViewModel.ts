import { useState, useEffect, useCallback } from 'react';
import { postService } from '@/shared/services/postService';
import { PostResponse, CommentResponse } from '@/shared/entities/PostEntity';
import { useAuthStore } from '@/store/authStore';

export function useHomeViewModel() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<Record<string, CommentResponse[]>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await postService.getPosts({ pageSize: 50 });
      setPosts(res.data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải bản tin.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const fetchComments = async (postId: string) => {
    setCommentLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await postService.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: res.data }));
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  /** Tạo bài viết (kèm ảnh nếu có) */
  const handleCreatePost = async (content: string, files: File[] = []) => {
    if (!content.trim() && files.length === 0) return false;
    setIsSubmitting(true);
    try {
      const res = await postService.createPostWithImages({ content }, files);
      setPosts(prev => [res.data, ...prev]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Không thể đăng bài.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    const originalPosts = [...posts];
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1
        } as PostResponse;
      }
      return p;
    }));

    try {
      const res = await postService.likePost({ postId });
      if (!res.success) throw new Error();
    } catch (err) {
      setPosts(originalPosts);
    }
  };

  const handleAddComment = async (postId: string, content: string, parentId?: string) => {
    if (!content.trim()) return;
    try {
      const res = await postService.addComment({ postId, content, parentId });

      // Enrich the comment with current user info for immediate display
      if (user) {
        res.data.userName = user.fullName;
        res.data.userAvatar = user.imageUrl || '';
      }
      if (parentId) res.data.parentId = parentId;

      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.data]
      }));
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, commentCount: p.commentCount + 1 } as PostResponse;
        }
        return p;
      }));
    } catch (err: any) {
      setError('Không thể gửi bình luận.');
    }
  };

  /** Cập nhật bài viết từ SignalR (Real-time) */
  const handlePostUpdate = useCallback((update: any) => {
    const { PostId, Data } = update;
    if (!PostId || !Data) return;

    setPosts(prev => prev.map(p => {
      if (p.id === PostId) {
        const newData = new PostResponse(Data);
        // Giữ lại isLiked của local nếu Data không có (hoặc xử lý tùy logic)
        return {
          ...newData,
          isLiked: p.isLiked // Tránh bị đè trạng thái 'Liked' của chính mình nếu broadcast không trả về Auth-specific data
        } as PostResponse;
      }
      return p;
    }));

    // Nếu là cập nhật comment và đang mở xem comments của post này, có thể cần load lại hoặc bổ sung
    // (Vì broadcast trả về toàn bộ post details mới, commentCount đã tăng)
  }, []);

  return {
    posts,
    comments,
    commentLoading,
    isLoading,
    isSubmitting,
    error,
    handleCreatePost,
    handleLike,
    handleAddComment,
    handlePostUpdate,
    fetchComments,
    refreshPosts: fetchPosts
  };
}

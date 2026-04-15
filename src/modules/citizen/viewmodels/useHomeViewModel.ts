import { useState, useEffect, useCallback } from 'react';
import { postService } from '@/shared/services/postService';
import { PostResponse, CommentResponse } from '@/shared/entities/PostEntity';

export function useHomeViewModel() {
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
        const isCurrentlyLiked = p.isLiked;
        return new PostResponse({
          ...p,
          isLiked: !isCurrentlyLiked,
          likeCount: isCurrentlyLiked ? p.likeCount - 1 : p.likeCount + 1
        });
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

  const handleAddComment = async (postId: string, content: string) => {
    if (!content.trim()) return;
    try {
      const res = await postService.addComment({ postId, content });
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.data]
      }));
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return new PostResponse({ ...p, commentCount: p.commentCount + 1 });
        }
        return p;
      }));
    } catch (err: any) {
      setError('Không thể gửi bình luận.');
    }
  };

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
    fetchComments,
    refreshPosts: fetchPosts
  };
}

import { apiGet, apiPost, apiDelete } from '../../lib/api';
import {
  PostResponse,
  CommentResponse,
  PostCreateRequest,
  CommentCreateRequest,
  LikeCreateRequest
} from '@/shared/entities/PostEntity';

export const postService = {
  getPosts: async (params?: { pageIndex?: number; pageSize?: number }): Promise<{ data: PostResponse[] }> => {
    try {
      const res = await apiGet<any>('/Post/feed', { limit: params?.pageSize ?? 50, offset: 0 });
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      return { data: items.map((item: any) => new PostResponse(item)) };
    } catch (e) {
      console.error('[PostService] getPosts error:', e);
      return { data: [] };
    }
  },

  getPostById: async (id: string): Promise<{ data: PostResponse | null }> => {
    try {
      const res = await apiGet<any>(`/Post/${id}`);
      const raw = res?.data || res;
      return { data: raw ? new PostResponse(raw) : null };
    } catch (e) {
      console.error('[PostService] getPostById error:', e);
      return { data: null };
    }
  },

  createPost: async (payload: Partial<PostCreateRequest>): Promise<{ data: PostResponse }> => {
    const backendPayload = {
      Title: payload.title || '',
      Content: payload.content || '',
      Type: payload.type || 'GENERAL'
    };
    const res = await apiPost<any>('/Post', backendPayload);
    return { data: new PostResponse(res?.data || res) };
  },

  /** Upload nhiều ảnh cho một bài viết đã tạo */
  uploadPostImages: async (postId: string, files: File[]): Promise<{ success: boolean }> => {
    if (!files.length) return { success: true };
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('Images', f)); // Use 'Images' or 'Files' ? Let's try 'Images'
      await apiPost<any>(`/Post/${postId}/images`, formData);
      return { success: true };
    } catch (e) {
      console.error('[PostService] uploadPostImages error:', e);
      return { success: false };
    }
  },

  /** Tạo bài viết + upload ảnh (nếu có) trong một lần */
  createPostWithImages: async (
    payload: Partial<PostCreateRequest>,
    files: File[] = []
  ): Promise<{ data: PostResponse }> => {
    const formData = new FormData();
    if (payload.content) formData.append('Content', payload.content);
    if (files && files.length > 0) {
      files.forEach(f => formData.append('Images', f));
    }
    const res = await apiPost<any>('/Post/create-with-images', formData);
    const rawPost = res?.data || res;
    return { data: new PostResponse(rawPost) };
  },

  getComments: async (postId: string): Promise<{ data: CommentResponse[] }> => {
    try {
      const res = await apiGet<any>(`/PostComment/post/${postId}`);
      const items = res?.data || (Array.isArray(res) ? res : []);
      return { data: items.map((item: any) => new CommentResponse(item)) };
    } catch (e) {
      console.error('[PostService] getComments error:', e);
      return { data: [] };
    }
  },

  addComment: async (payload: Partial<CommentCreateRequest>): Promise<{ data: CommentResponse }> => {
    const backendPayload = {
      PostId: payload.postId,
      Content: payload.content
    };
    const res = await apiPost<any>('/PostComment', backendPayload);
    const raw = res?.data || res;
    return { data: new CommentResponse(raw) };
  },

  likePost: async (payload: Partial<LikeCreateRequest>): Promise<{ success: boolean; data?: any }> => {
    try {
      const res = await apiPost<any>(`/PostLike/toggle/${payload.postId}`, {});
      return { success: true, data: res?.data || res };
    } catch (e) {
      console.error('[PostService] likePost error:', e);
      return { success: false };
    }
  },

  unlikePost: async (likeId: string): Promise<{ success: boolean }> => {
    try {
      await apiDelete(`/PostLike/${likeId}`);
      return { success: true };
    } catch (e) {
      console.error('[PostService] unlikePost error:', e);
      return { success: false };
    }
  }
};

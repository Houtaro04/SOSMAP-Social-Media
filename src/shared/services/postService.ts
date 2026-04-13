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
      const res = await apiGet<any>('/Post', params);
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

  createPost: async (payload: PostCreateRequest | Partial<PostCreateRequest>): Promise<{ data: PostResponse }> => {
    const request = payload instanceof PostCreateRequest ? payload : new PostCreateRequest(payload);
    const res = await apiPost<any>('/Post', request);
    return { data: new PostResponse(res?.data || res) };
  },

  getComments: async (postId: string): Promise<{ data: CommentResponse[] }> => {
    try {
      const res = await apiGet<any>('/PostComment', { postId });
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      return { data: items.map((item: any) => new CommentResponse(item)) };
    } catch (e) {
      console.error('[PostService] getComments error:', e);
      return { data: [] };
    }
  },

  addComment: async (payload: CommentCreateRequest | Partial<CommentCreateRequest>): Promise<{ data: CommentResponse }> => {
    const request = payload instanceof CommentCreateRequest ? payload : new CommentCreateRequest(payload);
    const res = await apiPost<any>('/PostComment', request);
    return { data: new CommentResponse(res?.data || res) };
  },

  likePost: async (payload: LikeCreateRequest | Partial<LikeCreateRequest>): Promise<{ success: boolean; data?: any }> => {
    try {
      const request = payload instanceof LikeCreateRequest ? payload : new LikeCreateRequest(payload);
      const res = await apiPost<any>('/PostLike', request);
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

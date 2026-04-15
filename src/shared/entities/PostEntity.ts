import { BASE_URL } from '@/lib/api';

const BACKEND_HOST = BASE_URL.replace('/api', '');

function toFullUrl(url: string): string {
  if (!url || url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  const clean = url.startsWith('/') ? url : `/${url}`;
  return `${BACKEND_HOST}${clean}`;
}

export class PostImageResponse {
  id: string = '';
  postId: string = '';
  imageUrl: string = '';

  constructor(init?: any) {
    if (init) {
      this.id = init.id || init.Id || '';
      this.postId = init.postId || init.PostId || '';
      const raw = init.imageUrl || init.ImageUrl || '';
      this.imageUrl = toFullUrl(raw);
    }
  }
}

export class PostResponse {
  id: string = '';
  userId: string = '';
  userName?: string = '';
  userAvatar?: string = '';
  content: string = '';
  title?: string = '';
  createdAt: string = '';
  updatedAt?: string = '';
  likeCount: number = 0;
  commentCount: number = 0;
  isLiked?: boolean = false;
  images?: PostImageResponse[] = [];

  constructor(init?: any) {
    if (init) {
      this.id = init.id || init.Id || '';
      this.userId = init.userId || init.UserId || '';
      this.userName = init.userName || init.UserName || init.authorName || init.AuthorName || '';
      this.userAvatar = init.userAvatar || init.UserAvatar || init.authorAvatar || init.AuthorAvatar || '';
      this.content = init.content || init.Content || '';
      this.title = init.title || init.Title || '';
      this.createdAt = init.createdAt || init.CreatedAt || '';
      this.updatedAt = init.updatedAt || init.UpdatedAt || '';
      this.likeCount = init.likeCount ?? init.LikeCount ?? 0;
      this.commentCount = init.commentCount ?? init.CommentCount ?? 0;
      this.isLiked = init.isLiked ?? init.IsLiked ?? false;

      const rawImages = init.images || init.Images || init.imageUrls || init.ImageUrls || [];
      if (Array.isArray(rawImages)) {
        this.images = rawImages.map(img => {
          if (typeof img === 'string') return new PostImageResponse({ imageUrl: img, postId: this.id });
          return new PostImageResponse(img);
        });
      }
    }
  }
}

export class CommentResponse {
  id: string = '';
  postId: string = '';
  userId: string = '';
  userName?: string = '';
  userAvatar?: string = '';
  content: string = '';
  createdAt: string = '';

  constructor(init?: any) {
    if (init) {
      this.id = init.id || init.Id || '';
      this.postId = init.postId || init.PostId || '';
      this.userId = init.userId || init.UserId || '';
      this.userName = init.userName || init.UserName || '';
      this.userAvatar = init.userAvatar || init.UserAvatar || '';
      this.content = init.content || init.Content || '';
      this.createdAt = init.createdAt || init.CreatedAt || '';
    }
  }
}

export class PostCreateRequest {
  title?: string = '';
  content: string = '';
  type?: string = 'GENERAL';

  constructor(init?: Partial<PostCreateRequest>) {
    if (init) Object.assign(this, init);
  }

  validate(): string | null {
    if (!this.content?.trim()) return 'Nội dung bài viết không được để trống.';
    return null;
  }
}

export class CommentCreateRequest {
  postId: string = '';
  content: string = '';

  constructor(init?: Partial<CommentCreateRequest>) {
    if (init) Object.assign(this, init);
  }

  validate(): string | null {
    if (!this.content?.trim()) return 'Nội dung bình luận không được để trống.';
    if (!this.postId) return 'Thiếu ID bài viết.';
    return null;
  }
}

export class LikeCreateRequest {
  postId: string = '';

  constructor(init?: Partial<LikeCreateRequest>) {
    if (init) Object.assign(this, init);
  }

  validate(): string | null {
    if (!this.postId) return 'Thiếu ID bài viết.';
    return null;
  }
}

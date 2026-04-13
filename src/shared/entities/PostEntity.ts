export class PostImageResponse {
  id: string = '';
  postId: string = '';
  imageUrl: string = '';

  constructor(init?: Partial<PostImageResponse>) {
    if (init) Object.assign(this, init);
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

  constructor(init?: Partial<PostResponse>) {
    if (init) {
      Object.assign(this, init);
      if (init.images) {
        this.images = init.images.map(img => new PostImageResponse(img));
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

  constructor(init?: Partial<CommentResponse>) {
    if (init) Object.assign(this, init);
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


import React, { useState, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useHomeViewModel } from '../viewmodels/useHomeViewModel';
import {
  Share2, Droplets, Wind, Siren, MessageSquare,
  ThumbsUp, Send, MoreHorizontal, ImagePlus, X,
  ChevronLeft, ChevronRight, Heart
} from 'lucide-react';
import { SosFormModal } from './SosFormModal';
import { ensureFullUrl } from '@/shared/services/profileService';
import '@/styles/HomeView.css';

/* ─── Image Gallery Modal ────────────────────────────────────────────────── */
interface GalleryModalProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
}
const GalleryModal: React.FC<GalleryModalProps> = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);
  return (
    <div className="gallery-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <button className="gallery-close" onClick={onClose}><X size={24} /></button>
      {images.length > 1 && (
        <button className="gallery-nav left" onClick={prev}><ChevronLeft size={28} /></button>
      )}
      <img className="gallery-img" src={images[idx]} alt={`Ảnh ${idx + 1}`} />
      {images.length > 1 && (
        <button className="gallery-nav right" onClick={next}><ChevronRight size={28} /></button>
      )}
      {images.length > 1 && (
        <div className="gallery-dots">
          {images.map((_, i) => (
            <span key={i} className={`gallery-dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Post Images Grid ────────────────────────────────────────────────────── */
interface PostImagesGridProps {
  images: { id: string; imageUrl: string }[];
  onOpen: (idx: number) => void;
}
const PostImagesGrid: React.FC<PostImagesGridProps> = ({ images, onOpen }) => {
  const count = images.length;
  if (!count) return null;
  return (
    <div className={`post-img-grid count-${Math.min(count, 4)}`}>
      {images.slice(0, 4).map((img, i) => (
        <div
          key={img.id}
          className="post-img-cell"
          style={{ position: 'relative' }}
          onClick={() => onOpen(i)}
        >
          <img src={img.imageUrl} alt={`Ảnh ${i + 1}`} />
          {i === 3 && count > 4 && (
            <div className="post-img-more">+{count - 4}</div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export const HomeView: React.FC = () => {
  const { user } = useAuthStore();
  const {
    posts,
    comments,
    commentLoading,
    isLoading,
    isSubmitting,
    handleCreatePost,
    handleLike,
    handleAddComment,
    fetchComments
  } = useHomeViewModel();

  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [gallery, setGallery] = useState<{ images: string[]; idx: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── File picker ─────────────────────────────────────────────────────── */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const merged = [...selectedFiles, ...files].slice(0, 6); // max 6 ảnh
    setSelectedFiles(merged);
    const urls = merged.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
    e.target.value = '';
  }, [selectedFiles]);

  const removePreview = (idx: number) => {
    const newFiles = [...selectedFiles];
    const newUrls = [...previewUrls];
    URL.revokeObjectURL(newUrls[idx]);
    newFiles.splice(idx, 1);
    newUrls.splice(idx, 1);
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  /* ── Post submit ─────────────────────────────────────────────────────── */
  const onPostSubmit = async () => {
    if (!newPostText.trim() && selectedFiles.length === 0) return;
    const success = await handleCreatePost(newPostText, selectedFiles);
    if (success) {
      setNewPostText('');
      previewUrls.forEach(u => URL.revokeObjectURL(u));
      setSelectedFiles([]);
      setPreviewUrls([]);
    }
  };

  /* ── Comment ─────────────────────────────────────────────────────────── */
  const onCommentSubmit = (postId: string) => {
    const text = commentInput[postId];
    if (!text?.trim()) return;
    handleAddComment(postId, text);
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
  };

  const toggleComments = (postId: string) => {
    if (activeCommentId === postId) {
      setActiveCommentId(null);
    } else {
      setActiveCommentId(postId);
      fetchComments(postId);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = `https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&size=200`;
  };

  /* ── Time format ─────────────────────────────────────────────────────── */
  const formatTime = (dt: string) => {
    if (!dt) return 'Vừa xong';
    try {
      const diff = (Date.now() - new Date(dt).getTime()) / 1000;
      if (diff < 60) return 'Vừa xong';
      if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
      if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
      return new Date(dt).toLocaleDateString('vi-VN');
    } catch { return dt; }
  };

  return (
    <div className="home-view">
      {/* HEADER */}
      <header className="home-header">
        <div className="welcome-info">
          <h1 className="welcome-title">Chào, {user?.fullName?.split(' ').pop() || 'bạn'} 👋</h1>
          <p className="welcome-subtitle">Cập nhật mới nhất từ mạng lưới an toàn của bạn.</p>
        </div>
        <button className="report-button" title="Báo cáo tình huống khẩn cấp" onClick={() => setIsSosModalOpen(true)}>
          <div className="report-button-icon"><Siren size={18} /></div>
          Báo cáo khẩn cấp
        </button>
      </header>

      {/* GRID */}
      <div className="home-grid">

        {/* ── LEFT: PRIMARY FEED ── */}
        <section className="primary-feed">

          {/* CREATE POST */}
          <div className="create-post-card">
            <div className="create-post-header">
              <div className="user-avatar">
                <img
                  src={ensureFullUrl(user?.imageUrl || undefined, user?.fullName || undefined)}
                  alt="Avatar"
                  onError={handleImageError}
                />
              </div>
              <div className="post-input-wrap">
                <textarea
                  className="post-input"
                  placeholder="Bạn đang nghĩ gì? Chia sẻ cập nhật an toàn..."
                  value={newPostText}
                  onChange={e => setNewPostText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.ctrlKey) onPostSubmit();
                  }}
                />

                {/* Image previews */}
                {previewUrls.length > 0 && (
                  <div className="post-preview-grid">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="post-preview-item">
                        <img src={url} alt={`Preview ${i + 1}`} />
                        <button className="post-preview-remove" onClick={() => removePreview(i)}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {previewUrls.length < 6 && (
                      <button className="post-preview-add" onClick={() => fileInputRef.current?.click()}>
                        <ImagePlus size={22} />
                        <span>Thêm ảnh</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions row */}
            <div className="create-post-actions">
              <button
                className="post-media-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Thêm ảnh"
              >
                <ImagePlus size={18} />
                <span>Ảnh / Video</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFileChange}
              />
              <button
                className="post-submit-btn"
                onClick={onPostSubmit}
                disabled={isSubmitting || (!newPostText.trim() && selectedFiles.length === 0)}
              >
                {isSubmitting ? (
                  <><span className="post-spinner" /> Đang đăng...</>
                ) : 'Đăng bài'}
              </button>
            </div>
          </div>

          {/* POST FEED */}
          <div className="posts-list">
            {isLoading && posts.length === 0 ? (
              <div className="loading-state">
                <div className="feed-spinner" />
                <p>Đang tải bản tin...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="empty-state">
                <ImagePlus size={40} />
                <p>Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!</p>
              </div>
            ) : (
              posts.map(post => {
                const imageUrls = (post.images || []).map(img => img.imageUrl);
                return (
                  <article key={post.id} className="post-item">
                    {/* Author row */}
                    <div className="post-header">
                      <div className="post-author-info">
                        <div className="user-avatar">
                          <img
                            src={ensureFullUrl(post.userAvatar || undefined, post.userName || undefined)}
                            alt={post.userName}
                            onError={handleImageError}
                          />
                        </div>
                        <div className="author-details">
                          <span className="author-name">{post.userName || 'Người dùng'}</span>
                          <span className="post-time">{formatTime(post.createdAt)}</span>
                        </div>
                      </div>
                      <button className="more-btn"><MoreHorizontal size={18} /></button>
                    </div>

                    {/* Content */}
                    <div className="post-content">
                      {post.title && <h4 className="post-title">{post.title}</h4>}
                      {post.content && <p className="post-content-text">{post.content}</p>}

                      {/* Image grid */}
                      {imageUrls.length > 0 && (
                        <PostImagesGrid
                          images={post.images!}
                          onOpen={idx => setGallery({ images: imageUrls, idx })}
                        />
                      )}
                    </div>

                    {/* Stats row */}
                    {(post.likeCount > 0 || post.commentCount > 0) && (
                      <div className="post-stats-row">
                        {post.likeCount > 0 && (
                          <span className="post-stat-item">
                            <Heart size={13} fill="#e53e3e" color="#e53e3e" /> {post.likeCount}
                          </span>
                        )}
                        {post.commentCount > 0 && (
                          <span className="post-stat-item">{post.commentCount} bình luận</span>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="post-actions-bar">
                      <button
                        className={`action-item ${post.isLiked ? 'liked' : ''}`}
                        onClick={() => handleLike(post.id)}
                      >
                        <ThumbsUp size={17} fill={post.isLiked ? 'currentColor' : 'none'} />
                        <span>{post.isLiked ? 'Đã thích' : 'Thích'}</span>
                      </button>

                      <button
                        className={`action-item ${activeCommentId === post.id ? 'active' : ''}`}
                        onClick={() => toggleComments(post.id)}
                      >
                        <MessageSquare size={17} />
                        <span>Bình luận</span>
                      </button>

                      <button className="action-item">
                        <Share2 size={17} />
                        <span>Chia sẻ</span>
                      </button>
                    </div>

                    {/* COMMENT SECTION */}
                    {activeCommentId === post.id && (
                      <div className="comment-section">
                        {commentLoading[post.id] ? (
                          <div className="comment-loading">
                            <div className="feed-spinner" /> Đang tải bình luận...
                          </div>
                        ) : (
                          <div className="comment-list">
                            {(comments[post.id] || []).length === 0 && (
                              <p className="comment-empty">Chưa có bình luận. Hãy là người đầu tiên!</p>
                            )}
                            {(comments[post.id] || []).map(comment => (
                              <div key={comment.id} className="comment-item">
                                <div className="user-avatar avatar-small">
                                  <img
                                    src={ensureFullUrl(comment.userAvatar || undefined, comment.userName || undefined)}
                                    alt={comment.userName}
                                    onError={handleImageError}
                                  />
                                </div>
                                <div className="comment-body">
                                  <span className="commenter-name">{comment.userName || 'Ẩn danh'}</span>
                                  <p className="comment-text">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comment input */}
                        <div className="comment-input-wrap">
                          <div className="user-avatar avatar-small">
                            <img
                              src={ensureFullUrl(user?.imageUrl || undefined, user?.fullName || undefined)}
                              alt="me"
                              onError={handleImageError}
                            />
                          </div>
                          <input
                            type="text"
                            className="comment-input"
                            placeholder="Viết bình luận..."
                            value={commentInput[post.id] || ''}
                            onChange={e => setCommentInput(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && onCommentSubmit(post.id)}
                          />
                          <button
                            className="comment-send-btn"
                            onClick={() => onCommentSubmit(post.id)}
                            disabled={!commentInput[post.id]?.trim()}
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {/* Metric cards */}
          <div className="quality-metrics">
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon-wrap water"><Droplets size={24} /></div>
                <h4 className="metric-title">Chất lượng nước</h4>
              </div>
              <p className="metric-status">An toàn</p>
              <p className="metric-desc">Chỉ số tinh khiết: 98%</p>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon-wrap air"><Wind size={24} /></div>
                <h4 className="metric-title">Chất lượng không khí</h4>
              </div>
              <p className="metric-status">Tốt</p>
              <p className="metric-desc">AQI: 32 - Rất trong lành</p>
            </div>
          </div>
        </section>

        {/* ── RIGHT COLUMN ── */}
        <aside className="secondary-column">
          <div className="alerts-card">
            <div className="alerts-header">
              <h3 className="card-title">Thông báo mới</h3>
            </div>
            <div className="alerts-list">
              <div className="alert-item">
                <div className="alert-dot"></div>
                <div className="alert-content">
                  <h4 className="alert-title">Lệnh sơ tán khu vực 4</h4>
                  <p className="alert-meta">Mức độ: Cao • 10:30 AM</p>
                </div>
              </div>
              <div className="alert-item resolved">
                <div className="alert-dot"></div>
                <div className="alert-content">
                  <h4 className="alert-title">Sự cố lưới điện</h4>
                  <p className="alert-meta">Phường Bến Nghé • 09:15 AM</p>
                </div>
              </div>
            </div>
            <div className="view-all-alerts">
              <button>Xem tất cả thông báo</button>
            </div>
          </div>
        </aside>
      </div>

      {/* GALLERY MODAL */}
      {gallery && (
        <GalleryModal
          images={gallery.images}
          startIndex={gallery.idx}
          onClose={() => setGallery(null)}
        />
      )}

      <SosFormModal isOpen={isSosModalOpen} onClose={() => setIsSosModalOpen(false)} />
    </div>
  );
};

export default HomeView;

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  AlertCircle, ThumbsUp, MessageCircle, Share2,
  ChevronLeft, ChevronRight, X, MapPin, MoreHorizontal, Send,
  ImagePlus
} from 'lucide-react';
import { postService } from '@/shared/services/postService';
import { sosService } from '@/shared/services/sosService';
import { ensureFullUrl } from '@/shared/services/profileService';
import type { PostResponse } from '@/shared/entities/PostEntity';
import type { SosReportResponse } from '@/shared/entities/SosEntity';
// Reuse citizen HomeView post-item styles
import { useNotificationHub } from '@/hooks/useNotificationHub';
import '@/styles/HomeView.css';
import '@/styles/VolunteerHomeView.css';

/* ─── Gallery Modal ─────────────────────────────────────────────────────────── */
const GalleryModal: React.FC<{ images: string[]; startIndex: number; onClose: () => void }> = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  return (
    <div className="gallery-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <button className="gallery-close" onClick={onClose}><X size={22} /></button>
      {images.length > 1 && <button className="gallery-nav left" onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}><ChevronLeft size={28} /></button>}
      <img className="gallery-img" src={images[idx]} alt={`Ảnh ${idx + 1}`} />
      {images.length > 1 && <button className="gallery-nav right" onClick={() => setIdx(i => (i + 1) % images.length)}><ChevronRight size={28} /></button>}
    </div>
  );
};



const levelLabel = (level: string) => {
  if (level === 'HIGH') return { text: 'KHẨN CẤP', cls: 'evacuation' };
  if (level === 'MEDIUM') return { text: 'Y TẾ', cls: 'medical' };
  return { text: 'HỖ TRỢ', cls: 'food' };
};

const formatTime = (dt: string) => {
  if (!dt) return 'Vừa xong';
  try {
    const diff = (Date.now() - new Date(dt).getTime()) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  } catch { return dt; }
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export const VolunteerHomeView: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [gallery, setGallery] = useState<{ images: string[]; idx: number } | null>(null);

  const [sosReports, setSosReports] = useState<SosReportResponse[]>([]);
  const [sosLoading, setSosLoading] = useState(true);
  const [stats, setStats] = useState({ completed: 0, processing: 0 });

  // Post creation states
  const [newPostText, setNewPostText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const { data } = await postService.getPosts({ pageSize: 20 });
      setPosts(data);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const loadSos = useCallback(async () => {
    setSosLoading(true);
    try {
      const { data } = await sosService.getSosReports();
      const pending = data
        .filter(r => r.status === 'PENDING' || r.status === 'PROCESSING' || r.status === 'APPROVED')
        .slice(0, 5);
      setSosReports(pending);
      setStats({
        completed: data.filter(r => r.status === 'COMPLETED' || r.status === 'RESOLVED' || r.status === 'DONE').length,
        processing: data.filter(r => r.status === 'PROCESSING' || r.status === 'RESPONDING' || r.status === 'APPROVED').length,
      });
    } finally {
      setSosLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    loadSos();
  }, [loadPosts, loadSos]);

  /* ── Creation logic ─────────────────────────────────────────────────── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const merged = [...selectedFiles, ...files];
      setSelectedFiles(merged);
      const urls = merged.map(f => URL.createObjectURL(f));
      setPreviewUrls(urls);
      e.target.value = '';
    }
  };

  const removePreview = (idx: number) => {
    const newFiles = [...selectedFiles];
    const newUrls = [...previewUrls];
    URL.revokeObjectURL(newUrls[idx]);
    newFiles.splice(idx, 1);
    newUrls.splice(idx, 1);
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  const handlePostSubmit = async () => {
    if (!newPostText.trim() && selectedFiles.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await postService.createPostWithImages({ content: newPostText }, selectedFiles);
      setPosts(prev => [res.data, ...prev]);
      setNewPostText('');
      previewUrls.forEach(u => URL.revokeObjectURL(u));
      setSelectedFiles([]);
      setPreviewUrls([]);
    } catch (err) {
      console.error('Error creating post', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
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
    await postService.likePost({ postId });
  };

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

  const handleAddComment = async (postId: string, content: string) => {
    if (!content.trim()) return;
    try {
      const res = await postService.addComment({ postId, content });

      // Enrich the comment with current user info
      if (user) {
        res.data.userName = user.fullName;
        res.data.userAvatar = user.imageUrl || '';
      }

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
    } catch (err) {
      console.error('Error adding comment', err);
    }
  };

  /** Cập nhật bài viết từ SignalR (Real-time) */
  const handlePostUpdate = useCallback((update: any) => {
    const { PostId, Data } = update;
    if (!PostId || !Data) return;

    setPosts(prev => prev.map(p => {
      if (p.id === PostId) {
        const newData = Data as PostResponse;
        return {
          ...newData,
          isLiked: p.isLiked
        } as PostResponse;
      }
      return p;
    }));
  }, []);

  // ─── Real-time Connection ───────────────────────────────────────────────
  useNotificationHub(
    (postData) => {
      handlePostUpdate(postData);
    },
    (sosData) => {
      console.log('Real-time SOS update in Volunteer Home:', sosData);
      loadSos(); // Re-fetch SOS list khi có SOS mới hoặc đổi trạng thái
    }
  );

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

  return (
    <div className="volunteer-home-wrapper" style={{ padding: '16px 24px 24px' }}>
      <header className="home-header" style={{ marginBottom: '24px' }}>
        <div className="welcome-info">
          <h1 className="welcome-title">Chào, {user?.fullName?.split(' ').pop() || 'tình nguyện viên'} 👋</h1>
          <p className="welcome-subtitle">Sẵn sàng phản ứng nhanh và hỗ trợ cộng đồng.</p>
        </div>
      </header>

      <div className="Volunteer-home">
        {/* ── LEFT: POST FEED ─────────────────────────────────────────────── */}
        <div className="main-feed-column">

          {/* CREATE POST CARD */}
          <div className="create-post-card" style={{ marginBottom: '24px' }}>
            <div className="create-post-header">
              <div className="vol-post-avatar">
                <img
                  src={ensureFullUrl(user?.imageUrl || undefined, user?.fullName || undefined)}
                  alt="Avatar"
                  onError={handleImageError}
                />
              </div>
              <div className="post-input-wrap">
                <textarea
                  className="post-input"
                  placeholder="Chia sẻ cập nhật tình hình cứu trợ..."
                  value={newPostText}
                  onChange={e => setNewPostText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.ctrlKey) handlePostSubmit();
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
                onClick={handlePostSubmit}
                disabled={isSubmitting || (!newPostText.trim() && selectedFiles.length === 0)}
              >
                {isSubmitting ? <span className="post-spinner" /> : <Send size={18} />}
                <span>{isSubmitting ? 'Đang đăng...' : 'Đăng tin'}</span>
              </button>
            </div>
          </div>

          <div className="feed-header">
            <h2>Tin tức hỗ trợ</h2>
            <button className="view-all-link">Xem tất cả</button>
          </div>

          {postsLoading && posts.length === 0 ? (
            <div className="loading-state">
              <div className="feed-spinner" />
              <p>Đang tải bài viết...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <p>Chưa có bài viết nào.</p>
            </div>
          ) : (
            posts.map(post => {
              const imageUrls = (post.images || []).map(img => img.imageUrl);
              const isLiked = post.isLiked;
              return (
                <article className="feed-card" key={post.id} style={{ marginBottom: '16px' }}>
                  <div className="card-content">
                    <div className="post-author-meta">
                      <div className="vol-post-avatar">
                        <img
                          src={ensureFullUrl(post.userAvatar || undefined, post.userName || undefined)}
                          alt={post.userName}
                          onError={handleImageError}
                        />
                      </div>
                      <div className="author-info">
                        <h4>{post.userName || 'Người dùng'}</h4>
                        <p>{formatTime(post.createdAt)}</p>
                      </div>
                      <button className="vol-more-btn"><MoreHorizontal size={18} /></button>
                    </div>

                    <h3 className="post-title">{post.title || ''}</h3>
                    <p className="post-desc">{post.content}</p>

                    {imageUrls.length > 0 && (
                      <div className={`vol-post-img-grid count-${Math.min(imageUrls.length, 4)}`}>
                        {imageUrls.slice(0, 4).map((url, i) => (
                          <div
                            key={i}
                            className="vol-post-img-cell"
                            onClick={() => setGallery({ images: imageUrls, idx: i })}
                          >
                            <img src={url} alt={`Post img ${i}`} onError={handleImageError} />
                            {imageUrls.length > 4 && i === 3 && (
                              <div className="vol-post-img-more">+{imageUrls.length - 4}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="vol-post-stats">
                    <span><ThumbsUp size={14} className={isLiked ? 'liked' : ''} /> {post.likeCount || 0}</span>
                    <span><MessageCircle size={14} /> {post.commentCount || 0}</span>
                  </div>

                  <div className="card-footer">
                    <div className="post-actions-left">
                      <button
                        className={`icon-action ${isLiked ? 'liked' : ''}`}
                        onClick={() => handleLike(post.id)}
                      >
                        <ThumbsUp size={18} fill={isLiked ? 'currentColor' : 'none'} />
                        <span>{isLiked ? 'Đã thích' : 'Thích'}</span>
                      </button>
                      <button
                        className="icon-action"
                        onClick={() => toggleComments(post.id)}
                      >
                        <MessageCircle size={18} />
                        <span>Bình luận</span>
                      </button>
                    </div>
                    <button className="icon-action"><Share2 size={18} /> <span>Chia sẻ</span></button>
                  </div>

                  {/* Comments Section */}
                  {activeCommentId === post.id && (
                    <div className="comment-section">
                      {commentLoading[post.id] ? (
                        <div className="vol-loading-small">Đang tải bình luận...</div>
                      ) : (comments[post.id] || []).length === 0 ? (
                        <div className="vol-empty-small">Chưa có bình luận nào.</div>
                      ) : (
                        <div className="comment-list">
                          {(comments[post.id] || []).map((comment) => (
                            <div className="comment-item" key={comment.id}>
                              <img
                                src={ensureFullUrl(comment.userAvatar || undefined, comment.userName || undefined)}
                                className="vol-comment-avatar"
                                alt={comment.userName}
                                onError={handleImageError}
                              />
                              <div className="comment-body">
                                <span className="commenter-name">{comment.userName}</span>
                                <p className="comment-text">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="vol-comment-row">
                        <img
                          src={ensureFullUrl(user?.imageUrl || undefined, user?.fullName || undefined)}
                          className="vol-comment-avatar"
                          alt="Me"
                          onError={handleImageError}
                        />
                        <div className="vol-comment-input-wrap">
                          <input
                            type="text"
                            placeholder="Viết bình luận..."
                            value={commentInput[post.id] || ''}
                            onChange={e => setCommentInput(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                handleAddComment(post.id, commentInput[post.id]);
                                setCommentInput(prev => ({ ...prev, [post.id]: '' }));
                              }
                            }}
                          />
                          <button
                            disabled={!commentInput[post.id]?.trim()}
                            onClick={() => {
                              handleAddComment(post.id, commentInput[post.id]);
                              setCommentInput(prev => ({ ...prev, [post.id]: '' }));
                            }}
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* ── RIGHT: SIDEBAR WIDGETS ──────────────────────────────────────── */}
        <div className="right-sidebar-column">

          {/* SOS Requests Widget */}
          <div className="widget requests-widget">
            <div className="widget-header">
              <div className="title-with-icon">
                <AlertCircle color="#F85A2B" size={24} />
                <h3>YÊU CẦU MỚI NHẤT</h3>
              </div>
              {sosReports.length > 0 && <span className="urgent-badge">CẤP BÁCH</span>}
            </div>

            <div className="urgent-requests-list">
              {sosLoading ? (
                <div className="vol-loading-small">Đang tải...</div>
              ) : sosReports.length === 0 ? (
                <div className="vol-empty-small">Không có yêu cầu cấp bách nào.</div>
              ) : (
                sosReports.map(report => {
                  const badge = levelLabel(report.level || '');
                  return (
                    <div className={`request-card ${badge.cls}`} key={report.id}>
                      <div className="req-card-header">
                        <span className="req-type">{badge.text}</span>
                        <span className="req-time">{formatTime(report.createdAt || '')}</span>
                      </div>
                      <h4>{report.details || 'Yêu cầu cứu trợ'}</h4>
                      {report.address && (
                        <div className="req-location" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} /> {report.address}
                        </div>
                      )}
                      <button
                        className="vol-req-respond-btn"
                        onClick={() => navigate('/volunteer/requests')}
                      >
                        Xem yêu cầu
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button className="outline-button full-width" onClick={() => navigate('/volunteer/requests')}>
              Xem tất cả yêu cầu
            </button>
          </div>

          {/* Activity Stats Widget */}
          <div className="widget activity-widget">
            <h3>Hoạt động của bạn</h3>
            <div className="stats-grid">
              <div className="stat-box light">
                <span className="stat-label">ĐÃ HỖ TRỢ</span>
                <span className="stat-value">{stats.completed}</span>
                <span className="stat-desc">Ca thành công</span>
              </div>
              <div className="stat-box dark">
                <span className="stat-label">ĐANG XỬ LÝ</span>
                <span className="stat-value">{String(stats.processing).padStart(2, '0')}</span>
                <span className="stat-desc">Yêu cầu</span>
              </div>
            </div>
          </div>

          {/* Quick Nav to Messages */}
          <div className="widget" style={{ padding: '16px', textAlign: 'center' }}>
            <MessageCircle size={28} color="#F85A2B" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>
              Trả lời tin nhắn từ người dân cần hỗ trợ
            </p>
            <button className="outline-button full-width" onClick={() => navigate('/volunteer/messages')}>
              Mở hộp thư
            </button>
          </div>

        </div>

        {/* Gallery Modal */}
        {gallery && (
          <GalleryModal
            images={gallery.images}
            startIndex={gallery.idx}
            onClose={() => setGallery(null)}
          />
        )}
      </div>
    </div>
  );
};

export default VolunteerHomeView;

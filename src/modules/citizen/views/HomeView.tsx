import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useHomeViewModel } from '../viewmodels/useHomeViewModel';
import { useNotificationHub } from '@/hooks/useNotificationHub';
import {
  Share2, Siren, MessageSquare,
  ThumbsUp, Send, MoreHorizontal, ImagePlus, X,
  ChevronLeft, ChevronRight, Heart, AlertTriangle, Flag, Trash2
} from 'lucide-react';
import { useGeolocation } from '@/core/utils/useGeolocation';
import { SosFormModal } from './SosFormModal';
import { CreatePostCard } from '@/shared/components/CreatePostCard';
import { CommentDropdown } from '@/shared/components/CommentDropdown';
import { ReportUserModal } from '@/shared/components/ReportUserModal';
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
  const navigate = useNavigate();
  const {
    posts,
    comments,
    commentLoading,
    isLoading,
    isSubmitting,
    handleCreatePost,
    handleLike,
    handleAddComment,
    handleEditComment,
    handleDeleteComment,
    handlePostUpdate,
    fetchComments
  } = useHomeViewModel();

  // ─── Real-time Connection ───────────────────────────────────────────────
  useNotificationHub(
    (postData) => {
      handlePostUpdate(postData);
    },
    (sosData) => {
      console.log('Real-time SOS update in Home:', sosData);
      // Có thể hiển thị toast hoặc cập nhật lại danh sách SOS nếu Home có hiển thị
    }
  );
  
  const { location: userLiveLocation } = useGeolocation();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const targetPostId = searchParams.get('postId');

  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [gallery, setGallery] = useState<{ images: string[]; idx: number } | null>(null);

  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>('');

  const [activePostMenuId, setActivePostMenuId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScrolledPostId = useRef<string | null>(null);

  // ─── Handle Deep Link to Post ──────────────────────────────────────────
  useEffect(() => {
    // Chỉ chạy nếu có targetPostId và có bài viết
    if (targetPostId && posts.length > 0 && lastScrolledPostId.current !== location.key) {
      let attempts = 0;
      const maxAttempts = 15; // Tăng số lần thử
      
      const checkAndScroll = setInterval(() => {
        const el = document.getElementById(`post-${targetPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-post');
          
          if (activeCommentId !== targetPostId) {
            setActiveCommentId(targetPostId);
            fetchComments(targetPostId);
          }

          // Đánh dấu đã cuộn thành công cho KEY hiện tại của location
          lastScrolledPostId.current = location.key;
          
          setTimeout(() => el.classList.remove('highlight-post'), 3000);
          clearInterval(checkAndScroll);
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(checkAndScroll);
        }
      }, 400); // Giảm nhẹ delay để nhạy hơn

      return () => clearInterval(checkAndScroll);
    }
    
    // Nếu targetPostId null (vào home bình thường), reset ref
    if (!targetPostId) {
      lastScrolledPostId.current = null;
    }
  }, [targetPostId, posts.length, location.key]); // Phụ thuộc vào key của route để bắt cả click vào cùng 1 URL

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
  const [replyingTo, setReplyingTo] = useState<Record<string, { commentId: string, userName: string } | null>>({});



  const onCommentSubmit = (postId: string) => {
    const text = commentInput[postId];
    if (!text?.trim()) return;
    
    const reply = replyingTo[postId];
    handleAddComment(postId, text, reply?.commentId);
    
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
    setReplyingTo(prev => ({ ...prev, [postId]: null }));
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
          <CreatePostCard onSubmit={handleCreatePost} isSubmitting={isSubmitting} />

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
                  <article id={`post-${post.id}`} key={post.id} className="post-item">
                    {/* Author row */}
                    <div className="post-header">
                      <div className="post-author-info">
                        <div
                          className="user-avatar"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (post.userId === user?.id) navigate('/citizen/profile');
                            else if (post.userId) navigate(`/citizen/profile/${post.userId}`);
                          }}
                        >
                          <img
                            src={ensureFullUrl(post.userAvatar || undefined, post.userName || undefined)}
                            alt={post.userName}
                            onError={handleImageError}
                          />
                        </div>
                        <div className="author-details">
                          <span
                            className="author-name"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              if (post.userId === user?.id) navigate('/citizen/profile');
                              else if (post.userId) navigate(`/citizen/profile/${post.userId}`);
                            }}
                          >
                            {post.userName || 'Người dùng'}
                          </span>
                          <span className="post-time">{formatTime(post.createdAt)}</span>
                        </div>
                      </div>
                      
                      {user && (
                        <div className="post-more-container" style={{ position: 'relative' }}>
                          <button 
                            className="more-btn" 
                            onClick={() => setActivePostMenuId(activePostMenuId === post.id ? null : post.id)}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          
                          {activePostMenuId === post.id && (
                            <div className="post-dropdown-menu">
                              {post.userId === user.id ? (
                                <button 
                                  className="dropdown-item delete"
                                  onClick={() => {
                                    if(window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
                                      handleDeletePost(post.id);
                                      setActivePostMenuId(null);
                                    }
                                  }}
                                >
                                  <Trash2 size={14} /> Xóa bài viết
                                </button>
                              ) : (
                                <button 
                                  className="dropdown-item report"
                                  onClick={() => {
                                    setReportTarget({ id: post.userId!, name: post.userName || 'Người dùng' });
                                    setActivePostMenuId(null);
                                  }}
                                >
                                  <Flag size={14} /> Báo cáo người dùng
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
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
                            {(comments[post.id] || []).filter(c => {
                              return !c.parentId;
                            }).map(comment => {
                              const replies = (comments[post.id] || []).filter(r => {
                                return r.parentId === comment.id;
                              });
                              return (
                                <React.Fragment key={comment.id}>
                                  <div className="comment-item">
                                    <div
                                      className="user-avatar avatar-small"
                                      style={{ cursor: 'pointer', flexShrink: 0 }}
                                      onClick={() => {
                                        if (comment.userId === user?.id) navigate('/citizen/profile');
                                        else if (comment.userId) navigate(`/citizen/profile/${comment.userId}`);
                                      }}
                                    >
                                      <img
                                        src={ensureFullUrl(comment.userAvatar || undefined, comment.userName || undefined)}
                                        alt={comment.userName}
                                        onError={handleImageError}
                                      />
                                    </div>
                                    <div className="comment-body">
                                      <div className="comment-content-main">
                                        <span
                                          className="commenter-name"
                                          style={{ cursor: 'pointer' }}
                                          onClick={() => {
                                            if (comment.userId === user?.id) navigate('/citizen/profile');
                                            else if (comment.userId) navigate(`/citizen/profile/${comment.userId}`);
                                          }}
                                        >{comment.userName || 'Ẩn danh'}</span>
                                        {editingCommentId === comment.id ? (
                                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                            <input 
                                              type="text" 
                                              className="comment-input" 
                                              style={{ padding: '4px 8px', fontSize: '13px', flex: 1 }}
                                              value={editingCommentText}
                                              onChange={e => setEditingCommentText(e.target.value)}
                                              onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                  handleEditComment(post.id, comment.id, editingCommentText);
                                                  setEditingCommentId(null);
                                                } else if (e.key === 'Escape') {
                                                  setEditingCommentId(null);
                                                }
                                              }}
                                              autoFocus
                                            />
                                            <button onClick={() => setEditingCommentId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#737373' }}>Hủy</button>
                                            <button onClick={() => {
                                                handleEditComment(post.id, comment.id, editingCommentText);
                                                setEditingCommentId(null);
                                              }} style={{ background: '#3b82f6', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer', color: '#fff', fontWeight: 'bold' }}>Lưu</button>
                                          </div>
                                        ) : (
                                          <span className="comment-text">{comment.content}</span>
                                        )}
                                      </div>
                                      <div className="comment-actions">
                                        <span className="comment-time">{formatTime(comment.createdAt)}</span>
                                          <button 
                                            className="comment-reply-btn"
                                            onClick={() => {
                                              setReplyingTo(prev => ({ 
                                                ...prev, 
                                                [post.id]: { commentId: comment.id, userName: comment.userName || 'Ẩn danh' } 
                                              }));
                                              setCommentInput(prev => ({ 
                                                ...prev, 
                                                [post.id]: `@${comment.userName || 'Ẩn danh'} ` 
                                              }));
                                            }}
                                          >
                                            Phản hồi
                                          </button>
                                          {comment.userId === user?.id && (
                                            <CommentDropdown 
                                              onEdit={() => {
                                                setEditingCommentId(comment.id);
                                                setEditingCommentText(comment.content);
                                              }}
                                              onDelete={() => {
                                                if(window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) handleDeleteComment(post.id, comment.id);
                                              }}
                                            />
                                          )}
                                        </div>
                                    </div>
                                  </div>
                                  
                                  {/* REPLIES */}
                                  {replies.map(reply => (
                                    <div key={reply.id} className="comment-item reply-item">
                                      <div
                                        className="user-avatar avatar-xsmall"
                                        style={{ cursor: 'pointer', flexShrink: 0 }}
                                        onClick={() => {
                                          if (reply.userId === user?.id) navigate('/citizen/profile');
                                          else if (reply.userId) navigate(`/citizen/profile/${reply.userId}`);
                                        }}
                                      >
                                        <img
                                          src={ensureFullUrl(reply.userAvatar || undefined, reply.userName || undefined)}
                                          alt={reply.userName}
                                          onError={handleImageError}
                                        />
                                      </div>
                                      <div className="comment-body">
                                        <div className="comment-content-main">
                                          <span
                                            className="commenter-name"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => {
                                              if (reply.userId === user?.id) navigate('/citizen/profile');
                                              else if (reply.userId) navigate(`/citizen/profile/${reply.userId}`);
                                            }}
                                          >{reply.userName || 'Ẩn danh'}</span>
                                          {editingCommentId === reply.id ? (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                              <input 
                                                type="text" 
                                                className="comment-input" 
                                                style={{ padding: '4px 8px', fontSize: '13px', flex: 1 }}
                                                value={editingCommentText}
                                                onChange={e => setEditingCommentText(e.target.value)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') {
                                                    handleEditComment(post.id, reply.id, editingCommentText);
                                                    setEditingCommentId(null);
                                                  } else if (e.key === 'Escape') {
                                                    setEditingCommentId(null);
                                                  }
                                                }}
                                                autoFocus
                                              />
                                              <button onClick={() => setEditingCommentId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#737373' }}>Hủy</button>
                                              <button onClick={() => {
                                                  handleEditComment(post.id, reply.id, editingCommentText);
                                                  setEditingCommentId(null);
                                                }} style={{ background: '#3b82f6', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer', color: '#fff', fontWeight: 'bold' }}>Lưu</button>
                                            </div>
                                          ) : (
                                            <span className="comment-text">{reply.content}</span>
                                          )}
                                        </div>
                                        <div className="comment-actions">
                                          <span className="comment-time">{formatTime(reply.createdAt)}</span>
                                          <button 
                                            className="comment-reply-btn"
                                            onClick={() => {
                                              setReplyingTo(prev => ({ 
                                                ...prev, 
                                                [post.id]: { commentId: comment.id || (comment as any).Id, userName: reply.userName || 'Ẩn danh' } 
                                              }));
                                              setCommentInput(prev => ({ 
                                                ...prev, 
                                                [post.id]: `@${reply.userName || 'Ẩn danh'} ` 
                                              }));
                                            }}
                                          >
                                            Phản hồi
                                          </button>
                                          {reply.userId === user?.id && (
                                            <CommentDropdown 
                                              onEdit={() => {
                                                setEditingCommentId(reply.id);
                                                setEditingCommentText(reply.content);
                                              }}
                                              onDelete={() => {
                                                if(window.confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) handleDeleteComment(post.id, reply.id);
                                              }}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        )}

                        {/* Reply Indicator */}
                        {replyingTo[post.id] && (
                          <div className="replying-to-bar">
                            <span>Đang trả lời <strong>{replyingTo[post.id]?.userName}</strong></span>
                            <button onClick={() => setReplyingTo(prev => ({ ...prev, [post.id]: null }))}>Hủy</button>
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

        </section>
      </div>

      {/* GALLERY MODAL */}
      {gallery && (
        <GalleryModal
          images={gallery.images}
          startIndex={gallery.idx}
          onClose={() => setGallery(null)}
        />
      )}

      <SosFormModal 
        isOpen={isSosModalOpen} 
        onClose={() => setIsSosModalOpen(false)} 
        userLiveLocation={userLiveLocation}
      />

      <ReportUserModal
        isOpen={!!reportTarget}
        reportedUserId={reportTarget?.id || ''}
        reportedUserName={reportTarget?.name || ''}
        onClose={() => setReportTarget(null)}
      />
    </div>
  );
};

export default HomeView;

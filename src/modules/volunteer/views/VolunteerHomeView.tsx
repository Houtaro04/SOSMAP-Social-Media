import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  AlertCircle, ThumbsUp, MessageCircle, Share2,
  ChevronLeft, ChevronRight, X, MapPin, MoreHorizontal, Send,
  ImagePlus, Trash2
} from 'lucide-react';
import { postService } from '@/shared/services/postService';
import { sosService } from '@/shared/services/sosService';
import { ensureFullUrl } from '@/shared/services/profileService';
import type { PostResponse } from '@/shared/entities/PostEntity';
import type { SosReportResponse } from '@/shared/entities/SosEntity';
import { CreatePostCard } from '@/shared/components/CreatePostCard';
// Reuse citizen HomeView post-item styles
import { useNotificationHub } from '@/hooks/useNotificationHub';
import { CommentDropdown } from '@/shared/components/CommentDropdown';
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
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const targetPostId = searchParams.get('postId');

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [gallery, setGallery] = useState<{ images: string[]; idx: number } | null>(null);
  const [replyingTo, setReplyingTo] = useState<Record<string, { id: string; name: string } | null>>({});
  const [activeMoreId, setActiveMoreId] = useState<string | null>(null);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>('');

  const [sosReports, setSosReports] = useState<SosReportResponse[]>([]);
  const [sosLoading, setSosLoading] = useState(true);
  const [stats, setStats] = useState({ completed: 0, processing: 0 });

  // Post creation states
  const [newPostText, setNewPostText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async (postId: string) => {
    setCommentLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const { data } = await postService.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: data }));
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  }, []);

  const lastScrolledPostId = useRef<string | null>(null);

  // ─── Handle Deep Link to Post ──────────────────────────────────────────
  useEffect(() => {
    if (targetPostId && posts.length > 0 && lastScrolledPostId.current !== targetPostId) {
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkAndScroll = setInterval(() => {
        const el = document.getElementById(`post-${targetPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-post');
          
          if (activeCommentId !== targetPostId) {
            setActiveCommentId(targetPostId);
            fetchComments(targetPostId);
          }

          lastScrolledPostId.current = targetPostId;
          
          setTimeout(() => el.classList.remove('highlight-post'), 3000);
          clearInterval(checkAndScroll);
        }
        
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(checkAndScroll);
        }
      }, 500);

      return () => clearInterval(checkAndScroll);
    }

    if (!targetPostId) {
      lastScrolledPostId.current = null;
    }
  }, [targetPostId, posts.length > 0]);


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
      // Chỉ lấy các đơn đã được duyệt (APPROVED, PROCESSING, DONE...)
      // Lọc ở Backend bằng cách loại bỏ PENDING
      const filterJson = JSON.stringify([{
        Column: 'Status',
        Condition: 'not_equals',
        Value: 'PENDING'
      }]);

      const { data } = await sosService.getSosReports({ FilterJson: filterJson, Limit: 50 });
      
      // Lọc thêm ở Frontend để chắc chắn và slice lấy 5 cái mới nhất
      const approvedOrProcessing = data
        .filter(r => r.status === 'PROCESSING' || r.status === 'APPROVED')
        .slice(0, 5);

      setSosReports(approvedOrProcessing);
      
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



  const handleAddComment = async (postId: string, content: string, parentId?: string) => {
    if (!content.trim()) return;
    try {
      const res = await postService.addComment({ postId, content, parentId });

      // Enrich the comment with current user info
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
    } catch (err) {
      console.error('Error adding comment', err);
    }
  };

  const handleEditComment = async (postId: string, commentId: string, content: string) => {
    if (!content.trim()) return;
    try {
      const res = await postService.editComment(commentId, { content });
      if (res.success) {
        setComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).map(c => (c.id || (c as any).Id) === commentId ? { ...c, content } : c)
        }));
      }
    } catch (err) {
      console.error('Error editing comment', err);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const res = await postService.deleteComment(commentId);
      if (res.success) {
        setComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => (c.id || (c as any).Id) !== commentId)
        }));
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, commentCount: Math.max(0, p.commentCount - 1) } as PostResponse;
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Error deleting comment', err);
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

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    try {
      const res = await postService.deletePost(postId);
      if (res.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        alert('Không thể xóa bài viết. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setActiveMoreId(null);
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
          <CreatePostCard onSubmit={async (text, files) => {
            if (!text.trim() && files.length === 0) return false;
            setIsSubmitting(true);
            try {
              const res = await postService.createPostWithImages({ content: text }, files);
              setPosts(prev => [res.data, ...prev]);
              return true;
            } catch (err) {
              console.error('Error creating post', err);
              return false;
            } finally {
              setIsSubmitting(false);
            }
          }} isSubmitting={isSubmitting} />

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
                <article id={`post-${post.id}`} className="feed-card" key={post.id} style={{ marginBottom: '16px' }}>
                  <div className="card-content">
                    <div className="post-author-meta">
                      <div
                        className="vol-post-avatar"
                        style={{ cursor: 'pointer' }}
                        onClick={() => post.userId && navigate(`/volunteer/profile/${post.userId}`)}
                      >
                        <img
                          src={ensureFullUrl(post.userAvatar || undefined, post.userName || undefined)}
                          alt={post.userName}
                          onError={handleImageError}
                        />
                      </div>
                      <div className="author-info">
                        <h4
                          style={{ cursor: 'pointer' }}
                          onClick={() => post.userId && navigate(`/volunteer/profile/${post.userId}`)}
                        >
                          {post.userName || 'Người dùng'}
                        </h4>
                        <p>{formatTime(post.createdAt)}</p>
                      </div>
                      
                      {user && (user.id === post.userId) && (
                        <div className="vol-more-wrapper">
                          <button 
                            className="vol-more-btn"
                            onClick={() => setActiveMoreId(activeMoreId === post.id ? null : post.id)}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          
                          {activeMoreId === post.id && (
                            <div className="vol-more-dropdown">
                              <button 
                                className="dropdown-item delete"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 size={16} />
                                <span>Xóa bài viết</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
                          {(comments[post.id] || []).filter(c => {
                            const pId = c.parentId || (c as any).ParentId;
                            return !pId;
                          }).map((comment) => {
                            const currentId = comment.id || (comment as any).Id;
                            const replies = (comments[post.id] || []).filter(r => {
                              const rParentId = r.parentId || (r as any).ParentId;
                              return rParentId === currentId && currentId;
                            });
                            return (
                              <React.Fragment key={comment.id}>
                                <div className="comment-item">
                                  <img
                                    src={ensureFullUrl(comment.userAvatar || undefined, comment.userName || undefined)}
                                    className="vol-comment-avatar"
                                    alt={comment.userName}
                                    onError={handleImageError}
                                  />
                                  <div className="comment-body">
                                    <div className="comment-content-main">
                                      <span className="commenter-name">{comment.userName}</span>
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
                                          setReplyingTo(prev => ({ ...prev, [post.id]: { id: comment.id, name: comment.userName } }));
                                          setCommentInput(prev => ({ ...prev, [post.id]: `@${comment.userName} ` }));
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
                                {replies.map(reply => (
                                  <div className="comment-item reply-item" key={reply.id}>
                                    <img
                                      src={ensureFullUrl(reply.userAvatar || undefined, reply.userName || undefined)}
                                      className="vol-comment-avatar avatar-xsmall"
                                      alt={reply.userName}
                                      onError={handleImageError}
                                    />
                                    <div className="comment-body">
                                        <div className="comment-content-main">
                                          <span className="commenter-name">{reply.userName}</span>
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
                                              setReplyingTo(prev => ({ ...prev, [post.id]: { id: comment.id || (comment as any).Id, name: reply.userName || 'Ẩn danh' } }));
                                              setCommentInput(prev => ({ ...prev, [post.id]: `@${reply.userName || 'Ẩn danh'} ` }));
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

                      {replyingTo[post.id] && (
                        <div className="replying-to-bar" style={{ margin: '8px 16px 8px 56px' }}>
                          <span>Đang trả lời <strong>{replyingTo[post.id]?.name}</strong></span>
                          <button onClick={() => setReplyingTo(prev => ({ ...prev, [post.id]: null }))}>Hủy</button>
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
                                const reply = replyingTo[post.id];
                                handleAddComment(post.id, commentInput[post.id], reply?.id);
                                setCommentInput(prev => ({ ...prev, [post.id]: '' }));
                                setReplyingTo(prev => ({ ...prev, [post.id]: null }));
                              }
                            }}
                          />
                          <button
                            disabled={!commentInput[post.id]?.trim()}
                            onClick={() => {
                              const reply = replyingTo[post.id];
                              handleAddComment(post.id, commentInput[post.id], reply?.id);
                              setCommentInput(prev => ({ ...prev, [post.id]: '' }));
                              setReplyingTo(prev => ({ ...prev, [post.id]: null }));
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

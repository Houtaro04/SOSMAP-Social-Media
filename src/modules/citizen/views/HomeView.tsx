import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useHomeViewModel } from '../viewmodels/useHomeViewModel';
import { Share2, Droplets, Wind, Siren, MessageSquare, ThumbsUp, Send, MoreHorizontal } from 'lucide-react';
import { SosFormModal } from './SosFormModal';
import { ensureFullUrl } from '@/shared/services/profileService';
import '@/styles/HomeView.css';

export const HomeView: React.FC = () => {
  const { user } = useAuthStore();
  const {
    posts,
    comments,
    isLoading,
    isSubmitting,
    handleCreatePost,
    handleLike,
    handleAddComment,
    fetchComments
  } = useHomeViewModel();

  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  const onPostSubmit = async () => {
    if (!newPostText.trim()) return;
    const success = await handleCreatePost(newPostText);
    if (success) setNewPostText('');
  };

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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = `https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&size=200`;
  };

  return (
    <div className="home-view">
      {/* HEADER */}
      <header className="home-header">
        <div className="welcome-info">
          <h1 className="welcome-title">Chào buổi sáng, {user?.fullName || 'bạn'}</h1>
          <p className="welcome-subtitle">Cập nhật mới nhất từ mạng lưới an toàn của bạn.</p>
        </div>

        <button className="report-button" title="Báo cáo tình huống khẩn cấp" onClick={() => setIsSosModalOpen(true)}>
          <div className="report-button-icon">
            <Siren size={18} />
          </div>
          Báo cáo khẩn cấp
        </button>
      </header>

      {/* DASHBOARD GRID */}
      <div className="home-grid">

        {/* LEFT COLUMN: PRIMARY FEED */}
        <section className="primary-feed">

          {/* CREATE POST AREA */}
          <div className="create-post-card">
            <div className="create-post-header">
              <div className="user-avatar">
                <img
                  src={ensureFullUrl(user?.imageUrl || undefined, user?.fullName || undefined)}
                  alt="Avatar"
                  onError={handleImageError}
                />
              </div>
              <textarea
                className="post-input"
                placeholder="Bạn đang nghĩ gì? Chia sẻ cập nhật an toàn..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
              />
            </div>
            <div className="create-post-actions">
              <button
                className="post-submit-btn"
                onClick={onPostSubmit}
                disabled={isSubmitting || !newPostText.trim()}
              >
                {isSubmitting ? 'Đang đăng...' : 'Đăng bài'}
              </button>
            </div>
          </div>

          {/* POST FEED */}
          <div className="posts-list">
            {isLoading && posts.length === 0 ? (
              <div className="loading-state">Đang tải bản tin...</div>
            ) : posts.length === 0 ? (
              <div className="empty-state">Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!</div>
            ) : (
              posts.map(post => (
                <article key={post.id} className="post-item">
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
                        <span className="author-name">{post.userName || 'Người dùng ẩn danh'}</span>
                        <span className="post-time">{post.createdAt || 'Vừa xong'}</span>
                      </div>
                    </div>
                    <button className="more-btn" title="Thêm"><MoreHorizontal size={18} /></button>
                  </div>

                  <div className="post-content">
                    <p className="post-content-text">{post.content}</p>
                    {post.images && post.images.length > 0 && (
                      <div className="post-images-grid">
                        {post.images.map(img => (
                          <img key={img.id} src={img.imageUrl} alt="Post content" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="post-actions-bar">
                    <button
                      className={`action-item ${post.isLiked ? 'liked' : ''}`}
                      onClick={() => handleLike(post.id)}
                    >
                      <ThumbsUp size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
                      <span>{post.likeCount} Thích</span>
                    </button>

                    <button
                      className={`action-item ${activeCommentId === post.id ? 'active' : ''}`}
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageSquare size={18} />
                      <span>{post.commentCount} Bình luận</span>
                    </button>

                    <button className="action-item">
                      <Share2 size={18} />
                      <span>Chia sẻ</span>
                    </button>
                  </div>

                  {/* COMMENT SECTION (Show when active) */}
                  {activeCommentId === post.id && (
                    <div className="comment-section">
                      <div className="comment-list">
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
                      <div className="comment-input-wrap">
                        <input
                          type="text"
                          className="comment-input"
                          placeholder="Viết bình luận..."
                          value={commentInput[post.id] || ''}
                          onChange={(e) => setCommentInput(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && onCommentSubmit(post.id)}
                        />
                        <button className="comment-send-btn" onClick={() => onCommentSubmit(post.id)}>
                          <Send size={18} color="#ec5b13" />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>

          {/* Quality Cards Grid (Static metrics) */}
          <div className="quality-metrics">
            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon-wrap water">
                  <Droplets size={24} />
                </div>
                <h4 className="metric-title">Chất lượng nước</h4>
              </div>
              <div>
                <p className="metric-status">An toàn</p>
                <p className="metric-desc">Chỉ số tinh khiết: 98%</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <div className="metric-icon-wrap air">
                  <Wind size={24} />
                </div>
                <h4 className="metric-title">Chất lượng không khí</h4>
              </div>
              <div>
                <p className="metric-status">Tốt</p>
                <p className="metric-desc">AQI: 32 - Rất trong lành</p>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: SECONDARY COLUMN (ALERTS) */}
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

      <SosFormModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
      />
    </div>
  );
};

export default HomeView;

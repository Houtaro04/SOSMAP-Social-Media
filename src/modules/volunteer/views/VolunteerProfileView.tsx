import React from 'react';
import {
  Edit3, Star, CheckCircle, Clock, Award,
  MapPin, Phone, Mail, Shield, Heart, MessageSquare, Send, X, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import VolunteerProfileModal from './VolunteerProfileModal';
import { useVolunteerProfileViewModel } from '../viewmodels/useVolunteerProfileViewModel';
import '@/styles/VolunteerProfileView.css';

export const VolunteerProfileView: React.FC = () => {
  const {
    user,
    isLoading,
    stats,
    history,
    isModalOpen,
    setIsModalOpen,
    activeTab,
    setActiveTab,
    myPosts,
    isPostsLoading,
    selectedPost,
    postComments,
    isCommentsLoading,
    handleSelectPost,
    handleAddCommentToPost,
    handleDeletePost,
    handleAvatarChange,
    handleAvatarRemove,
    handleUpdateProfile,
    displayName,
    displayEmail,
    avatarUrl
  } = useVolunteerProfileViewModel();

  const [commentText, setCommentText] = React.useState('');
  const [replyingTo, setReplyingTo] = React.useState<{ id: string, name: string } | null>(null);
  const [modalImageIdx, setModalImageIdx] = React.useState(0);

  const onSelectPost = (post: any) => {
    setModalImageIdx(0);
    handleSelectPost(post);
  };

  const formatTime = (dt: string) => {
    if (!dt) return 'Vừa xong';
    try {
      const diff = (Date.now() - new Date(dt).getTime()) / 1000;
      if (diff < 60) return 'Vừa xong';
      if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
      return new Date(dt).toLocaleDateString('vi-VN');
    } catch { return dt; }
  };

  const onCommentSubmit = () => {
    if (!selectedPost || !commentText.trim()) return;
    handleAddCommentToPost(selectedPost.id, commentText, replyingTo?.id);
    setCommentText('');
    setReplyingTo(null);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=F85A2B&color=fff&size=200`;
  };

  if (isLoading) {
    return (
      <div className="rp-loading-container">
        <div className="rp-spinner"></div>
        <p>Đang tải thông tin cứu hộ...</p>
      </div>
    );
  }

  return (
    <div className="rp-container">
      {/* HEADER CARD */}
      <div className="rp-header-card">
        <div className="rp-header-left">
          <div className="rp-avatar-wrap">
            <img 
              src={avatarUrl} 
              alt="avatar" 
              className="rp-avatar" 
              onError={handleImageError}
            />
            <div className="rp-avatar-badge">
              <Shield size={14} color="white" />
            </div>
          </div>
          <div className="rp-user-info">
            <div className="rp-name-row">
              <h1 className="rp-name">{displayName.toUpperCase()}</h1>
            </div>
            <div className="rp-role-tag">
              <Shield size={13} /> NHÂN VIÊN CỨU HỘ
            </div>
            <div className="rp-contact-row">
              <span className="rp-contact-item"><Mail size={13} /> {displayEmail}</span>
              <span className="rp-contact-item"><MapPin size={13} /> {user?.address || 'Đà Nẵng, Việt Nam'}</span>
              <span className="rp-contact-item"><Phone size={13} /> {user?.phone || '0905 123 456'}</span>
            </div>
          </div>
        </div>
        <button className="rp-edit-btn" onClick={() => setIsModalOpen(true)}>
          <Edit3 size={16} /> Chỉnh sửa hồ sơ
        </button>
      </div>

      {/* STATS ROW */}
      <div className="rp-stats-row">
        <div className="rp-stat-card">
          <div className="rp-stat-icon orange"><CheckCircle size={24} color="#F85A2B" /></div>
          <div className="rp-stat-value">{stats ? stats.successMissions : 0}</div>
          <div className="rp-stat-label">Nhiệm vụ đã hoàn thành</div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon blue"><Clock size={24} color="#3B82F6" /></div>
          <div className="rp-stat-value">{stats ? stats.totalMissions : 0}</div>
          <div className="rp-stat-label">Tổng nhiệm vụ</div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon teal"><Shield size={24} color="#14B8A6" /></div>
          <div className="rp-stat-value">
            {stats.totalMissions > 0 ? Math.round((stats.successMissions / stats.totalMissions) * 100) : 0}%
          </div>
          <div className="rp-stat-label">Tỷ lệ thành công</div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="rp-main">
        {/* LEFT: HISTORY + BADGES */}
        <div className="rp-left-col">
          <div className="rp-card">
            <div className="rp-card-tabs">
              <button
                className={`rp-tab ${activeTab === 'HISTORY' ? 'active' : ''}`}
                onClick={() => setActiveTab('HISTORY')}
              >
                Lịch sử nhiệm vụ
              </button>
              <button
                className={`rp-tab ${activeTab === 'POSTS' ? 'active' : ''}`}
                onClick={() => setActiveTab('POSTS')}
              >
                Tin tức đã chia sẻ
              </button>
            </div>
            
            <div className="rp-card-content">
              {activeTab === 'HISTORY' ? (
                <div className="rp-history-list">
                  {history.length > 0 ? history.map(item => (
                    <div key={item.id} className="rp-history-item">
                      <div className="rp-history-icon">
                        {item.status === 'COMPLETED' ? <CheckCircle size={18} color="#10B981" /> : <Clock size={18} color="#3B82F6" />}
                      </div>
                      <div className="rp-history-info">
                        <div className="rp-history-title">{item.note && item.note.includes(']') ? item.note.split(']').pop()?.trim() : 'Nhiệm vụ cứu hộ'}</div>
                        <div className="rp-history-meta">
                          <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                          <span className="dot">•</span>
                          <span className={`status-tag ${item.status.toLowerCase()}`}>{item.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang xử lý'}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="rp-empty-state">Bạn chưa thực hiện nhiệm vụ nào.</div>
                  )}
                </div>
              ) : (
                <div className="posts-tab-content" style={{ padding: '24px 0' }}>
                  {isPostsLoading ? (
                    <div className="posts-loading" style={{ textAlign: 'center', padding: '20px' }}>Đang tải bài viết...</div>
                  ) : myPosts.length === 0 ? (
                    <div className="empty-posts" style={{ textAlign: 'center', padding: '40px', color: '#828282' }}>
                      Bạn chưa chia sẻ bài viết nào.
                    </div>
                  ) : (
                    <div className="profile-posts-grid">
                      {myPosts.map(post => (
                        <div key={post.id} className="grid-post-item" onClick={() => onSelectPost(post)}>
                          <img 
                            src={post.images && post.images.length > 0 ? post.images[0].imageUrl : 'https://via.placeholder.com/300x300?text=No+Image'} 
                            alt="post"
                          />
                          <div className="grid-item-overlay">
                            <span className="stat-item"><Heart size={16} fill="white" /> {post.likeCount}</span>
                            <span className="stat-item"><MessageSquare size={16} fill="white" /> {post.commentCount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: QUICK INFO */}
        <div className="rp-right-col">
          <div className="rp-card quick-stats">
            <h3 className="rp-card-title">Hoạt động tuần này</h3>
            <div className="rp-weekly-stat">
              <span>Nhiệm vụ hoàn thành</span><strong>{stats.weeklyCompleted}</strong>
            </div>
            <div className="rp-weekly-stat">
              <span>Người được giúp đỡ</span><strong>{stats.weeklyHelped}</strong>
            </div>
            <div className="rp-weekly-stat">
              <span>Thời gian phản hồi TB</span><strong>--</strong>
            </div>
            <div className="rp-weekly-stat">
              <span>Điểm đóng góp</span>
              <strong style={{ color: '#F59E0B' }}>+{stats.weeklyCompleted * 10}</strong>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <VolunteerProfileModal
          onClose={() => setIsModalOpen(false)}
          onAvatarChange={handleAvatarChange}
          onAvatarRemove={handleAvatarRemove}
          onSave={handleUpdateProfile}
          initialData={{
            fullName: user?.fullName || displayName,
            email: user?.email || displayEmail,
            phone: user?.phone || '',
            address: user?.address || '',
            imageUrl: avatarUrl,
          }}
        />
      )}

      {/* POST DETAIL MODAL */}
      {selectedPost && (() => {
        const post = selectedPost;
        const images = post.images || [];
        return (
          <div className="post-detail-overlay" onClick={() => onSelectPost(null)}>
            <button className="modal-close-btn" onClick={() => onSelectPost(null)}><X /></button>
            <div className="post-detail-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-content-grid">
                <div className="modal-image-side">
                  {images.length > 0 ? (
                    <>
                      <img 
                        src={images[modalImageIdx]?.imageUrl || ''} 
                        alt={`post detail ${modalImageIdx}`} 
                      />
                      {images.length > 1 && (
                        <>
                          <button 
                            className="modal-nav-btn left" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalImageIdx(prev => (prev - 1 + images.length) % images.length);
                            }}
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <button 
                            className="modal-nav-btn right" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalImageIdx(prev => (prev + 1) % images.length);
                            }}
                          >
                            <ChevronRight size={24} />
                          </button>
                          <div className="modal-image-dots">
                            {images.map((_, i) => (
                              <div key={i} className={`modal-dot ${i === modalImageIdx ? 'active' : ''}`} />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="no-image-placeholder">Không có ảnh</div>
                  )}
                </div>
                
                <div className="modal-info-side">
                  <div className="modal-author-header">
                    <div className="modal-author-info">
                      <img src={avatarUrl} alt="avt" className="avatar-small round-avatar" />
                      <div className="author-meta">
                        <strong>{displayName}</strong>
                        <span>{formatTime(post.createdAt)}</span>
                      </div>
                    </div>
                    <div className="modal-header-actions">
                      <button 
                        className="modal-delete-btn" 
                        onClick={() => handleDeletePost(post.id)}
                        title="Xóa bài viết"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="modal-post-content">
                    {post.title && <h3 className="modal-p-title">{post.title}</h3>}
                    <p>{post.content}</p>
                  </div>

                  <div className="modal-comments-area">
                    {isCommentsLoading ? (
                      <div className="comments-loading">Đang tải bình luận...</div>
                    ) : postComments.length === 0 ? (
                      <div className="no-comments">Chưa có bình luận nào.</div>
                    ) : (
                      <div className="comments-scroll">
                        {postComments.filter(c => {
                          const pId = c.parentId || (c as any).ParentId;
                          return !pId;
                        }).map(comment => {
                          const currentId = comment.id || (comment as any).Id;
                          const replies = postComments.filter(r => {
                            const rParentId = r.parentId || (r as any).ParentId;
                            return rParentId === currentId && currentId;
                          });
                          return (
                            <React.Fragment key={comment.id}>
                              <div className="comment-item">
                                <img src={ensureFullUrl(comment.userAvatar, comment.userName)} alt="avt" className="avatar-small round-avatar" />
                                <div className="comment-body">
                                  <div className="comment-content-main">
                                    <span className="commenter-name">{comment.userName}</span>
                                    <span className="comment-text">{comment.content}</span>
                                  </div>
                                  <div className="comment-actions">
                                    <span className="comment-time">{formatTime(comment.createdAt)}</span>
                                    <button 
                                      className="comment-reply-btn"
                                      onClick={() => {
                                        setReplyingTo({ id: comment.id, name: comment.userName || '' });
                                        setCommentText(`@${comment.userName} `);
                                      }}
                                    >
                                      Phản hồi
                                    </button>
                                  </div>
                                </div>
                              </div>
                              {replies.map(reply => (
                                <div key={reply.id} className="comment-item reply-item">
                                  <img src={ensureFullUrl(reply.userAvatar, reply.userName)} alt="avt" className="avatar-xsmall round-avatar" />
                                  <div className="comment-body">
                                    <div className="comment-content-main">
                                      <span className="commenter-name">{reply.userName}</span>
                                      <span className="comment-text">{reply.content}</span>
                                    </div>
                                    <div className="comment-actions">
                                      <span className="comment-time">{formatTime(reply.createdAt)}</span>
                                      <button 
                                        className="comment-reply-btn"
                                        onClick={() => {
                                          setReplyingTo({ id: comment.id || (comment as any).Id, name: reply.userName || 'Ẩn danh' });
                                          setCommentText(`@${reply.userName || 'Ẩn danh'} `);
                                        }}
                                      >
                                        Phản hồi
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <div className="modal-stats-bar">
                      <span>❤️ {post.likeCount} lượt thích</span>
                    </div>
                    
                    {replyingTo && (
                      <div className="reply-bar">
                        <span>Đang trả lời <strong>{replyingTo.name}</strong></span>
                        <button onClick={() => setReplyingTo(null)}>Hủy</button>
                      </div>
                    )}

                    <div className="modal-comment-input">
                      <input 
                        type="text" 
                        placeholder="Thêm bình luận..." 
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && onCommentSubmit()}
                      />
                      <button onClick={onCommentSubmit} disabled={!commentText.trim()}>
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default VolunteerProfileView;

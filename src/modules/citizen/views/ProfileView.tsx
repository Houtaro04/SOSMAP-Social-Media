import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Phone, MapPin, UserCheck, Edit3,
  FileText, CheckCircle, Clock,
  Package, Activity, Droplets,
  Heart, MessageSquare, Send, X, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';
import { PostResponse } from '@/shared/entities/PostEntity';
import { ensureFullUrl } from '@/shared/services/profileService';
import '@/styles/ProfileView.css';

const ProfileView: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const isOwnProfile = !userId;
  const {
    profile,
    stats,
    history,
    myPosts,
    isPostsLoading,
    activeTab,
    setActiveTab,
    selectedPost,
    postComments,
    isCommentsLoading,
    handleSelectPost,
    handleAddComment: handleAddCommentToPost,
    handleDeletePost,
    isLoading,
    isEditing,
    setIsEditing,
    isSaving,
    formData,
    handleInputChange,
    saveProfile,
    cancelEdit,
    handleAvatarChange,
    handleAvatarRemove,
    message
  } = useProfileViewModel(userId);

  const [commentText, setCommentText] = React.useState('');
  const [replyingTo, setReplyingTo] = React.useState<{ id: string, name: string } | null>(null);
  const [modalImageIdx, setModalImageIdx] = React.useState(0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const onSelectPost = (post: PostResponse | null) => {
    setModalImageIdx(0);
    handleSelectPost(post);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarChange(file);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const name = profile?.fullName || formData.fullName || 'User';
    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=200`;
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

  const getIconForHistory = (type: string) => {
    switch (type) {
      case 'FOOD': return <Package size={20} color="#F59E0B" />;
      case 'MEDICAL': return <Activity size={20} color="#EF4444" />;
      case 'EVACUATION': return <Droplets size={20} color="#3B82F6" />;
      default: return <FileText size={20} color="#6366F1" />;
    }
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <p>Đang tải thông tin cá nhân...</p>
      </div>
    );
  }

  // ==== FORM EDIT VIEW ====
  if (isEditing) {
    return (
      <div className="profile-edit-container">
        <div className="edit-form-card">
          <header className="edit-header">
            <h2>Chỉnh sửa hồ sơ</h2>
            <p>Cập nhật thông tin cá nhân của bạn</p>
          </header>

          <div className="edit-body">
            <div className="avatar-edit-section">
              <img 
                src={ensureFullUrl(formData.imageUrl, formData.fullName)} 
                alt="avatar preview" 
                className="edit-avatar"
                onError={handleImageError}
              />
              <div className="avatar-actions">
                <h4>Ảnh đại diện</h4>
                <p>Khuyên dùng ảnh vuông, tối đa 2MB</p>
                <div className="action-btns">
                  <button className="btn-light" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                    {isSaving ? 'Đang tải...' : 'Thay đổi ảnh'}
                  </button>
                  <button className="btn-text-danger" onClick={handleAvatarRemove} disabled={isSaving}>Gỡ ảnh</button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  hidden 
                  accept="image/*" 
                  onChange={onFileChange}
                />
              </div>
            </div>

            <div className="edit-form-grid">
              <div className="edit-group">
                <label>Họ và tên</label>
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Nhập họ tên"
                />
              </div>
              <div className="edit-group">
                <label>Số điện thoại</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div className="edit-group full-width">
                <label>Email</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Nhập email"
                />
              </div>
              <div className="edit-group full-width">
                <label>Địa chỉ</label>
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Nhập địa chỉ"
                />
              </div>
            </div>
          </div>

          <footer className="edit-footer">
            <button className="btn-cancel" onClick={cancelEdit} disabled={isSaving}>Hủy bỏ</button>
            <button className="btn-save" onClick={saveProfile} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </footer>
        </div>
      </div>
    );
  }

  // ==== MAIN PROFILE VIEW ====
  return (
    <div className="profile-dashboard-container">
      {message && (
        <div className={`toast-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* 1. PROFILE SUMMARY CARD */}
      <div className="dashboard-card profile-summary-card">
        <div className="summary-left">
          <div className="avatar-wrapper">
            <img 
              src={ensureFullUrl(profile?.imageUrl, profile?.fullName)} 
              alt="avatar" 
              onError={handleImageError}
            />
          </div>
          
          <div className="summary-info">
            <h2>{profile?.fullName}</h2>
            <div className="role-tag">
              <UserCheck size={14} />
              {profile?.role === 'VOLUNTEER' ? 'TÌNH NGUYỆN VIÊN' : 'NGƯỜI DÙNG CÁ NHÂN'}
            </div>
            <div className="contact-row" style={{ marginTop: '12px' }}>
              {profile?.phone && <div className="contact-item"><Phone size={14} /> {profile.phone}</div>}
              {profile?.address && <div className="contact-item"><MapPin size={14} /> {profile.address}</div>}
            </div>
          </div>
        </div>

        {isOwnProfile && (
          <button className="btn-edit-profile" onClick={() => setIsEditing(true)}>
            <Edit3 size={16} /> Chỉnh sửa hồ sơ
          </button>
        )}
      </div>

      {/* 2. STATS ROW */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#EBF5FF' }}>
            {profile?.role === 'VOLUNTEER' ? <CheckCircle size={24} color="#F85A2B" /> : <FileText size={24} color="#3B82F6" />}
          </div>
          <p className="stat-number">{profile?.role === 'VOLUNTEER' ? stats?.completed : stats?.totalSent || 0}</p>
          <p className="stat-label">{profile?.role === 'VOLUNTEER' ? 'Nhiệm vụ đã hoàn thành' : 'Yêu cầu cứu trợ đã gửi'}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#ECFDF5' }}>
            {profile?.role === 'VOLUNTEER' ? <Clock size={24} color="#3B82F6" /> : <CheckCircle size={24} color="#10B981" />}
          </div>
          <p className="stat-number">{profile?.role === 'VOLUNTEER' ? stats?.totalSent : stats?.completed || 0}</p>
          <p className="stat-label">{profile?.role === 'VOLUNTEER' ? 'Tổng nhiệm vụ' : 'Yêu cầu đã hoàn thành'}</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#FFF7ED' }}>
            <UserCheck size={24} color={profile?.role === 'VOLUNTEER' ? "#14B8A6" : "#F59E0B"} />
          </div>
          <p className="stat-number">
            {profile?.role === 'VOLUNTEER' ? `${stats?.volunteerSuccessRate}%` : (stats?.processing || 0)}
          </p>
          <p className="stat-label">{profile?.role === 'VOLUNTEER' ? 'Tỷ lệ thành công' : 'Yêu cầu đang xử lý'}</p>
        </div>
      </div>

      {/* 3. HISTORY & POSTS SECTION */}
      <div className="dashboard-card history-section">
        <div className="history-tabs">
          <button 
            className={`tab-btn ${activeTab === 'HISTORY' ? 'active' : ''}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            {profile?.role === 'VOLUNTEER' ? 'Lịch sử nhiệm vụ' : (isOwnProfile ? 'Lịch sử yêu cầu cứu trợ' : 'Yêu cầu cứu trợ')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'POSTS' ? 'active' : ''}`}
            onClick={() => setActiveTab('POSTS')}
          >
            Tin tức đã chia sẻ
          </button>
        </div>


        <div className="tab-content">
          {activeTab === 'HISTORY' ? (
            <div className="history-list">
              {history.length === 0 ? (
                <div className="empty-history" style={{ padding: '40px', textAlign: 'center', color: '#828282' }}>
                  Bạn chưa gửi yêu cầu cứu trợ nào.
                </div>
              ) : (
                history.map(item => (
                  <div className="history-item" key={item.id}>
                    <div className="hist-icon-box">
                      {getIconForHistory(item.type)}
                    </div>
                    <div className="hist-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4>{item.title}</h4>
                        <span className={`status-tag ${item.status === 'DONE' ? 'completed' : 'processing'}`} style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: item.status === 'DONE' ? '#DEF7EC' : '#E1EFFE',
                          color: item.status === 'DONE' ? '#03543F' : '#1E429F',
                          fontWeight: '600'
                        }}>
                          {item.status === 'DONE' ? 'ĐÃ HOÀN THÀNH' : 'ĐANG XỬ LÝ'}
                        </span>
                      </div>
                      <p className="hist-address">{item.address}</p>
                      <span className="hist-time">{item.timeLine}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="posts-tab-content" style={{ padding: '24px 32px' }}>
              {isPostsLoading ? (
                <div className="posts-loading" style={{ textAlign: 'center', padding: '20px' }}>Đang tải bài viết...</div>
              ) : myPosts.length === 0 ? (
                <div className="empty-posts" style={{ textAlign: 'center', padding: '40px', color: '#828282' }}>
                  {isOwnProfile ? 'Bạn chưa chia sẻ bài viết nào.' : 'Người dùng này chưa có bài viết nào.'}

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
                      <img src={ensureFullUrl(profile?.imageUrl, profile?.fullName)} alt="avt" className="avatar-small round-avatar" />
                      <div className="author-meta">
                        <strong>{profile?.fullName}</strong>
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

export default ProfileView;

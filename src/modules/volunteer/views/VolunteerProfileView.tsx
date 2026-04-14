import React from 'react';
import {
  Edit3, Star, CheckCircle, Clock, Award,
  MapPin, Phone, Mail, Shield
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
    handleAvatarChange,
    handleAvatarRemove,
    handleUpdateProfile,
    displayName,
    displayEmail,
    avatarUrl
  } = useVolunteerProfileViewModel();

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
            <img src={avatarUrl} alt="avatar" className="rp-avatar" />
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
          <div className="rp-stat-icon teal"><Award size={24} color="#14B8A6" /></div>
          <div className="rp-stat-value">{stats ? stats.totalHours : 0}h</div>
          <div className="rp-stat-label">Giờ phục vụ</div>
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
                className={`rp-tab ${activeTab === 'BADGES' ? 'active' : ''}`}
                onClick={() => setActiveTab('BADGES')}
              >
                Thành tích & Huy hiệu
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
                <div className="rp-badges-grid">
                  <div className="rp-badge-placeholder">Đang cập nhật hệ thống huy hiệu...</div>
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
              <span>Nhiệm vụ hoàn thành</span><strong></strong>
            </div>
            <div className="rp-weekly-stat">
              <span>Người được giúp đỡ</span><strong></strong>
            </div>
            <div className="rp-weekly-stat">
              <span>Thời gian phản hồi TB</span><strong></strong>
            </div>
            <div className="rp-weekly-stat">
              <span>Đánh giá tuần này</span>
              <strong style={{ color: '#F59E0B' }}></strong>
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
    </div>
  );
};

export default VolunteerProfileView;


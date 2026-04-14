import React from 'react';
import {
  Phone, MapPin, UserCheck, Edit3,
  FileText, CheckCircle, Clock,
  Package, Activity, Droplets
} from 'lucide-react';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';
import { ensureFullUrl } from '@/shared/services/profileService';
import '@/styles/ProfileView.css';

export const ProfileView: React.FC = () => {
  const {
    profile,
    stats,
    history,
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
  } = useProfileViewModel();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  if (isLoading) {
    return <div className="profile-loading">Đang tải biểu mẫu...</div>;
  }

  // ==== FORM EDIT VIEW ====
  if (isEditing) {
    return (
      <div className="profile-edit-container">
        <div className="edit-form-card">
          <div className="edit-header">
            <h2>Thiết lập tài khoản</h2>
            <p>Cập nhật thông tin cá nhân của bạn.</p>
          </div>

          <div className="avatar-edit-section">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={onFileChange}
            />
            <img
              src={ensureFullUrl(formData.imageUrl, formData.fullName)}
              alt="Avatar"
              className="edit-avatar"
              onError={handleImageError}
            />
            <div className="avatar-actions">
              <h4>Ảnh đại diện</h4>
              <p>PNG hoặc JPG. Kích thước tối đa 5MB.</p>
              <div className="action-btns">
                <button className="btn-light" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>Thay đổi</button>
                <button className="btn-text-danger" onClick={handleAvatarRemove} disabled={isSaving}>Gỡ bỏ</button>
              </div>
            </div>
          </div>

          {message && (
            <div className={`form-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="edit-form-grid">
            <div className="edit-group">
              <label>HỌ VÀ TÊN</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={e => handleInputChange('fullName', e.target.value)}
              />
            </div>

            <div className="edit-group">
              <label>SỐ ĐIỆN THOẠI</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
              />
            </div>

            <div className="edit-group full-width">
              <label>EMAIL CÁ NHÂN</label>
              <input
                type="text"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
              />
            </div>

            <div className="edit-group full-width">
              <label>ĐỊA CHỈ THƯỜNG TRÚ / KHU VỰC</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => handleInputChange('address', e.target.value)}
              />
            </div>
          </div>

          <div className="edit-footer">
            <button className="btn-cancel" onClick={cancelEdit} disabled={isSaving}>Hủy</button>
            <button className="btn-save" onClick={saveProfile} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==== DASHBOARD VIEW (isEditing = false) ====

  const getIconForHistory = (type: string) => {
    switch (type) {
      case 'FOOD': return <Package size={20} className="hist-icon food" />;
      case 'WATER': return <Droplets size={20} className="hist-icon water" />;
      case 'MEDICAL': return <Activity size={20} className="hist-icon medical" />;
      default: return <FileText size={20} className="hist-icon" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="badge badge-warning">Đang chờ</span>;
      case 'APPROVED': return <span className="badge badge-info">Đã duyệt</span>;
      case 'PROCESSING': return <span className="badge badge-warning">Đang xử lý</span>;
      case 'COMPLETED': return <span className="badge badge-success">Hoàn thành</span>;
      case 'CLOSED': return <span className="badge badge-grey">Đã đóng</span>;
      default: return null;
    }
  };

  return (
    <div className="profile-dashboard-container">
      {/* 1. Header Card */}
      <div className="dashboard-card profile-summary-card">
        <div className="summary-left">
          <div className="avatar-wrapper">
            <img
              src={ensureFullUrl(profile?.imageUrl, profile?.fullName)}
              alt="Avatar"
              onError={handleImageError}
            />
            <div className="avatar-camera-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none"><circle cx="12" cy="12" r="10"></circle></svg>
            </div>
          </div>
          <div className="summary-info">
            <h2>{profile?.fullName}</h2>
            <div className="contact-row">
              <div className="contact-item">
                <Phone size={14} /> <span>{profile?.phone}</span>
              </div>
              <div className="contact-item">
                <MapPin size={14} /> <span>{profile?.address}</span>
              </div>
            </div>
            <div className="role-tag">
              <UserCheck size={14} /> NGƯỜI DÙNG CÁ NHÂN
            </div>
          </div>
        </div>

        <button className="btn-edit-profile" onClick={() => setIsEditing(true)}>
          <Edit3 size={16} /> Chỉnh sửa hồ sơ
        </button>
      </div>

      {/* 2. Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <FileText size={24} color="#3b82f6" />
          </div>
          <div className="stat-number">{stats?.totalSent}</div>
          <p>Yêu cầu cứu trợ đã gửi</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <CheckCircle size={24} color="#10b981" />
          </div>
          <div className="stat-number">{stats?.completed}</div>
          <p>Yêu cầu đã hoàn thành</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <Clock size={24} color="#f59e0b" />
          </div>
          <div className="stat-number">{stats?.processing}</div>
          <p>Yêu cầu đang xử lý</p>
        </div>
      </div>

      {/* 3. History Tabs */}
      <div className="dashboard-card history-section">
        <div className="history-tabs">
          <button className="tab-btn active">Lịch sử yêu cầu cứu trợ</button>
          <button className="tab-btn">Tin tức đã chia sẻ</button>
        </div>

        <div className="history-list">
          {history.map(item => (
            <div className="history-item" key={item.id}>
              <div className="hist-icon-box">
                {getIconForHistory(item.type)}
              </div>
              <div className="hist-content">
                <h4>{item.title}</h4>
                <p className="hist-address">{item.address}</p>
                <span className="hist-time">{item.timeLine}</span>
              </div>
              <div className="hist-status">
                {getStatusBadge(item.status)}
              </div>
            </div>
          ))}
        </div>

        <div className="history-footer">
          <button className="btn-view-all">Xem tất cả lịch sử yêu cầu</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;

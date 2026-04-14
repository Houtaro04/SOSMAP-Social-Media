import React, { useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { ensureFullUrl } from '@/shared/services/profileService';
import '@/styles/VolunteerProfileModal.css';

interface ProfileModalProps {
  onClose: () => void;
  initialData: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    imageUrl: string;
  };
  onAvatarChange?: (file: File) => Promise<string | undefined>;
  onAvatarRemove?: () => Promise<string | undefined>;
  onSave?: (data: any) => Promise<any>;
}

const VolunteerProfileModal: React.FC<ProfileModalProps> = ({
  onClose, initialData, onAvatarChange, onAvatarRemove, onSave
}) => {
  const [form, setForm] = useState({ ...initialData });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const handleSave = async () => {
    if (!form.fullName.trim()) return;

    setIsSaving(true);
    try {
      if (onSave) {
        await onSave({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          imageUrl: form.imageUrl,
        });
      }
      setIsSaving(false);
      setSaved(true);
      setTimeout(onClose, 1000);
    } catch (err) {
      setIsSaving(false);
      console.error('[VolunteerProfileModal] Save error:', err);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(form.fullName)}&background=0D8ABC&color=fff&size=200`;
  };

  return (
    <div className="rpm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="rpm-modal">
        {/* HEADER */}
        <div className="rpm-header">
          <div>
            <h2 className="rpm-title">Thiết lập tài khoản</h2>
            <p className="rpm-subtitle">Cập nhật thông tin cá nhân của bạn</p>
          </div>
          <button className="rpm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="rpm-body">
          {/* AVATAR SECTION */}
          <div className="rpm-avatar-section">
            <div className="rpm-avatar-wrap" onClick={() => fileInputRef.current?.click()}>
              <img
                src={ensureFullUrl(form.imageUrl, form.fullName)}
                alt="avatar"
                className="rpm-avatar"
                onError={handleImageError}
              />
              <div className="rpm-avatar-overlay">
                <Camera size={20} color="white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file && onAvatarChange) {
                  try {
                    const newUrl = await onAvatarChange(file);
                    if (newUrl !== undefined) {
                      setForm(prev => ({ ...prev, imageUrl: newUrl }));
                    }
                  } catch(err) {}
                }
              }}
            />
            <div className="rpm-avatar-actions">
              <h4>Ảnh đại diện</h4>
              <p>PNG hoặc JPG. Kích thước tối đa 5MB.</p>
              <div className="rpm-avatar-btns">
                <button className="rpm-btn-light" onClick={() => fileInputRef.current?.click()}>
                  Thay đổi
                </button>
                <button className="rpm-btn-danger" onClick={async () => {
                  if (onAvatarRemove) {
                    const newUrl = await onAvatarRemove();
                    if (newUrl !== undefined) setForm(prev => ({ ...prev, imageUrl: newUrl }));
                  }
                }}>Gỡ bỏ</button>
              </div>
            </div>
          </div>

          {/* FORM GRID */}
          <div className="rpm-form-grid">
            <div className="rpm-field">
              <label>HỌ VÀ TÊN</label>
              <input
                type="text"
                value={form.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
                placeholder="Họ và tên đầy đủ"
              />
            </div>

            <div className="rpm-field">
              <label>SỐ ĐIỆN THOẠI</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="0905 xxx xxx"
              />
            </div>

            <div className="rpm-field full">
              <label>EMAIL CÁ NHÂN</label>
              <input
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="rpm-field full">
              <label>ĐỊA CHỈ NHÀ</label>
              <input
                type="text"
                value={form.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder="Số nhà, đường, phường..."
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="rpm-footer">
          <button className="rpm-cancel-btn" onClick={onClose} disabled={isSaving}>
            Hủy
          </button>
          <button
            className={`rpm-save-btn ${saved ? 'saved' : ''}`}
            onClick={handleSave}
            disabled={isSaving || saved}
          >
            {saved ? '✓ Đã lưu!' : isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfileModal;


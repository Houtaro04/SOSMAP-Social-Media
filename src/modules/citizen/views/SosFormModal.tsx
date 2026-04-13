import React, { useEffect } from 'react';
import { useSosFormViewModel } from '../viewmodels/useSosFormViewModel';
import { MapPin, UploadCloud, CheckCircle, AlertCircle, EyeOff } from 'lucide-react';
import '@/styles/SosFormModal.css';

interface SosFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userLiveLocation?: { lat: number, lng: number } | null;
  userId?: string;
}

export const SosFormModal: React.FC<SosFormModalProps> = ({ isOpen, onClose, onSuccess, userLiveLocation, userId }) => {
  const {
    formData,
    isSubmitting,
    message,
    handleInputChange,
    submitForm
  } = useSosFormViewModel(onClose, onSuccess, userLiveLocation ? { lat: userLiveLocation.lat, lng: userLiveLocation.lng } : undefined, userId);

  // Focus lock or scroll lock could go here for Polish
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="sos-modal-overlay">
      <div className="sos-modal-content">

        {/* Header Section */}
        <div className="sos-modal-header">
          <div className="anonymous-badge">
            <EyeOff size={16} /> Tiết lộ tên ẩn danh
          </div>
          <h2>GỬI YÊU CẦU CỨU TRỢ</h2>
          <p>Vui lòng cung cấp thông tin chính xác nhất để đội cứu hộ có thể tiếp cận bạn nhanh nhất có thể.</p>
        </div>

        {/* Messaging (Success/Error) */}
        {message && (
          <div className={`sos-modal-message ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {/* Input Form */}
        <div className="sos-form-grid">

          <div className="sos-form-group">
            <label>HỌ VÀ TÊN</label>
            <input
              type="text"
              placeholder="Nhập tên của bạn"
              value={formData.fullName}
              onChange={e => handleInputChange('fullName', e.target.value)}
            />
          </div>

          <div className="sos-form-group">
            <label>SỐ ĐIỆN THOẠI <span className="req">*</span></label>
            <input
              type="text"
              placeholder="0xxx xxx xxx"
              value={formData.phoneNumber}
              onChange={e => handleInputChange('phoneNumber', e.target.value)}
            />
          </div>

          <div className="sos-form-group full-width">
            <label>ĐỊA CHỈ CẦN CỨU TRỢ <span className="req">*</span></label>
            <div className="input-with-icon">
              <input
                type="text"
                placeholder="Số nhà, tên đường, phường/xã..."
                value={formData.address}
                onChange={e => handleInputChange('address', e.target.value)}
              />
              <MapPin className="input-inner-icon text-red" size={20} />
            </div>
          </div>

          <div className="sos-form-group full-width">
            <label>TÌNH TRẠNG HIỆN TẠI <span className="req">*</span></label>
            <textarea
              rows={3}
              placeholder="Mô tả ngắn gọn tình hình hiện tại của bạn..."
              value={formData.details}
              onChange={e => handleInputChange('details', e.target.value)}
            />
          </div>

          <div className="sos-form-group full-width">
            <label>TẢI LÊN HÌNH ẢNH</label>
            <div className="upload-dashed-box">
              <UploadCloud size={32} className="upload-icon" />
              <p><strong>Chọn hoặc kéo thả hình ảnh</strong></p>
              <span>PNG hoặc JPG, kích thước tối đa 5MB</span>
            </div>
          </div>

        </div>

        {/* Form Footer Buttons */}
        <div className="sos-modal-footer">
          <button
            className="sos-btn-submit"
            onClick={submitForm}
            disabled={isSubmitting || message?.type === 'success'}
          >
            {isSubmitting ? 'ĐANG XỬ LÝ...' : 'GỬI YÊU CẦU CỨU TRỢ >'}
          </button>
          <button className="sos-btn-cancel" onClick={onClose} disabled={isSubmitting}>
            Đóng
          </button>
        </div>

        <div className="sos-privacy-notice">
          © THÔNG TIN SẼ ĐƯỢC BẢO MẬT BỞI SOSMAP
        </div>

      </div>
    </div>
  );
};

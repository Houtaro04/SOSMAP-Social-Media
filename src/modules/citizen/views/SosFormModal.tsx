import React, { useEffect } from 'react';
import { useSosFormViewModel } from '../viewmodels/useSosFormViewModel';
import { MapPin, CheckCircle, AlertCircle, EyeOff } from 'lucide-react';
import '@/styles/SosFormModal.css';

interface SosFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userLiveLocation?: { lat: number, lng: number } | null;
  userId?: string;
}

export const SosFormModal: React.FC<SosFormModalProps> = ({ isOpen, onClose, onSuccess, userLiveLocation, userId }) => {
  const initialLocMemo = React.useMemo(() =>
    userLiveLocation ? { lat: userLiveLocation.lat, lng: userLiveLocation.lng } : undefined,
    [userLiveLocation?.lat, userLiveLocation?.lng]
  );

  const {
    formData,
    isSubmitting,
    message,
    handleInputChange,
    submitForm,
    resetForm
  } = useSosFormViewModel(onClose, onSuccess, initialLocMemo, userId);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Focus lock or scroll lock could go here for Polish
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      resetForm(); // Tự động reset khi đóng modal
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, resetForm]);

  if (!isOpen) return null;

  return (
    <div className="sos-modal-overlay">
      <div className="sos-modal-content">

        {/* Header Section */}
        <div className="sos-modal-header">
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
            <label>MỨC ĐỘ / LOẠI HÌNH CỨU TRỢ <span className="req">*</span></label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { value: 'URGENT', label: 'Cấp bách / Sơ tán', color: '#EF4444' },
                { value: 'MEDICAL', label: 'Y tế khẩn cấp', color: '#14B8A6' },
                { value: 'LOGISTICS', label: 'Hậu cần / Thực phẩm', color: '#F59E0B' },
                { value: 'FLOOD', label: 'Khu vực ngập lụt', color: '#3B82F6' },
              ].map(tag => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => handleInputChange('level', tag.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    border: `1.5px solid ${formData.level === tag.value ? tag.color : 'transparent'}`,
                    backgroundColor: formData.level === tag.value ? `${tag.color}15` : '#f3f4f6',
                    cursor: 'pointer',
                    fontWeight: formData.level === tag.value ? 600 : 500,
                    color: '#333',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tag.color }}></span>
                  {tag.label}
                </button>
              ))}
            </div>
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



        </div>

        {/* Form Footer Buttons */}
        <div className="sos-modal-footer">
          <button
            className="sos-btn-submit"
            onClick={submitForm}
            disabled={isSubmitting || message?.type === 'success'}
          >
            {isSubmitting ? 'ĐANG XỬ LÝ...' : 'GỬI YÊU CẦU CỨU TRỢ'}
          </button>
          <button className="sos-btn-cancel" onClick={handleClose} disabled={isSubmitting}>
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

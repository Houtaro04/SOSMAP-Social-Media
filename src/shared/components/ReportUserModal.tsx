import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { apiPost } from '@/lib/api';
import './ReportUserModal.css';

interface ReportUserModalProps {
  reportedUserId: string;
  reportedUserName: string;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Spam hoặc nội dung rác',
  'Ngôn từ gây thù ghét',
  'Quấy rối hoặc bắt nạt',
  'Thông tin sai lệch/lừa đảo',
  'Hành vi nguy hiểm',
  'Khác'
];

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  reportedUserId,
  reportedUserName,
  isOpen,
  onClose
}) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setReason(REPORT_REASONS[0]);
    setDetails('');
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await apiPost('/UserReport', {
        reportedUserId,
        reason,
        details,
        status: 'PENDING'
      });
      alert('Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
      handleClose();
    } catch (err) {
      alert('Lỗi khi gửi báo cáo. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="report-modal-overlay">
      <div className="report-modal-content">
        <div className="report-modal-header">
          <div className="report-header-title">
            <AlertTriangle size={20} color="#EF4444" />
            <h3>Báo cáo người dùng</h3>
          </div>
          <button className="report-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="report-modal-body">
          <p className="report-target-info">
            Bạn đang báo cáo: <strong>{reportedUserName}</strong>
          </p>

          <div className="report-field">
            <label>Lý do báo cáo</label>
            <select 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="report-select"
            >
              {REPORT_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="report-field">
            <label>Chi tiết thêm (không bắt buộc)</label>
            <textarea
              placeholder="Vui lòng cung cấp thêm thông tin để chúng tôi xử lý tốt hơn..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="report-textarea"
            />
          </div>
        </div>

        <div className="report-modal-footer">
          <button className="report-cancel-btn" onClick={handleClose} disabled={isSubmitting}>
            Hủy
          </button>
          <button 
            className="report-submit-btn" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </button>
        </div>
      </div>
    </div>
  );
};

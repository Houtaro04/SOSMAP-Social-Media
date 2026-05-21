import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { rescueTaskService } from '@/shared/services/rescueTaskService';
import '@/styles/AdminDetailModals.css'; // Reuse existing modal styles

interface CancelTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onSuccess: () => void;
}

export const CancelTaskModal: React.FC<CancelTaskModalProps> = ({
  isOpen, onClose, taskId, onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do hủy nhiệm vụ.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await rescueTaskService.requestCancel(taskId, reason);
      if (res.success) {
        alert('Đã gửi yêu cầu hủy nhiệm vụ đến Admin. Vui lòng chờ duyệt.');
        setReason('');
        onSuccess();
      } else {
        alert(res.error || 'Lỗi khi gửi yêu cầu hủy.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="adm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-modal-box" style={{ maxWidth: '500px' }}>
        <button type="button" className="adm-modal-close" onClick={onClose} disabled={isSubmitting}>
          <X size={18} />
        </button>

        <div className="adm-modal-header" style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444' }}>
            <AlertTriangle size={24} />
            <h2 className="adm-modal-title" style={{ margin: 0 }}>Yêu cầu hủy nhiệm vụ</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="adm-modal-body">
          <p style={{ marginBottom: '1rem', color: '#4B5563', fontSize: '0.95rem' }}>
            Bạn đang yêu cầu hủy nhiệm vụ hiện tại. Vui lòng nêu rõ lý do để Admin có thể xem xét và phê duyệt.
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              Lý do xin hủy <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do chi tiết..."
              rows={4}
              required
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div className="adm-modal-footer" style={{ borderTop: 'none', paddingTop: 0, justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="adm-modal-btn-close"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ background: '#F3F4F6', color: '#374151', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              style={{
                background: '#EF4444',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: (isSubmitting || !reason.trim()) ? 'not-allowed' : 'pointer',
                opacity: (isSubmitting || !reason.trim()) ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

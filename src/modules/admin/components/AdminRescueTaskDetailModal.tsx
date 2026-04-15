import React from 'react';
import {
  X, Clock, FileText, Hash,
  CheckCircle, Loader2, AlertCircle
} from 'lucide-react';
import type { RescueTaskItem } from '../viewmodels/useAdminDashboardViewModel';
import { STATUS_MAP } from '../viewmodels/useAdminDashboardViewModel';
import '@/styles/AdminDetailModals.css';

interface Props {
  task: RescueTaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  formatDate: (dt: string) => string;
}

const STATUS_PILL: Record<string, string> = {
  PENDING:    'pending',
  APPROVED:   'approved',
  PROCESSING: 'processing',
  COMPLETED:  'completed',
  RESOLVED:   'completed',
  CLOSED:     'closed',
  CANCELLED:  'closed',
};

/** Tách URL ảnh ra khỏi note (format: [Ảnh xác minh: <url>] <text>) */
function parseNote(note: string): { imageUrl: string | null; text: string } {
  const match = note?.match(/\[Ảnh xác minh:\s*(https?:\/\/[^\]]+)\]\s*(.*)/s);
  if (match) {
    return { imageUrl: match[1].trim(), text: match[2].trim() };
  }
  return { imageUrl: null, text: note || '' };
}

export const AdminRescueTaskDetailModal: React.FC<Props> = ({
  task, isOpen, onClose, formatDate
}) => {
  if (!isOpen || !task) return null;

  const statusKey = (task.status || 'PENDING').toUpperCase();
  const statusCfg = STATUS_MAP[statusKey] || { label: statusKey, cls: 'badge-pending' };
  const pillCls = STATUS_PILL[statusKey] || 'pending';
  const { imageUrl, text: noteText } = parseNote(task.note);

  return (
    <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-modal-box">
        <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>

        {/* Header */}
        <div className="adm-modal-header">
          <div className="adm-modal-header-badges">
            <span className={`adm-mpill ${pillCls}`}>{statusCfg.label}</span>
          </div>
          <h2 className="adm-modal-title">Chi tiết nhiệm vụ cứu trợ</h2>
          <div className="adm-modal-subtitle">
            <Clock size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {formatDate(task.createdAt)}
          </div>
        </div>

        {/* Body */}
        <div className="adm-modal-body">

          {/* ID Info */}
          <div className="adm-modal-section">
            <div className="adm-modal-section-label"><Hash size={13} /> THÔNG TIN NHIỆM VỤ</div>
            <div className="adm-modal-info-grid">
              <div className="adm-modal-info-item">
                <Hash size={14} />
                <div className="adm-modal-info-item-inner">
                  <span className="adm-modal-info-lbl">ID Nhiệm vụ</span>
                  <span className="adm-modal-info-val" style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    #{task.id.substring(0, 12)}
                  </span>
                </div>
              </div>
              <div className="adm-modal-info-item">
                <CheckCircle size={14} />
                <div className="adm-modal-info-item-inner">
                  <span className="adm-modal-info-lbl">Trạng thái</span>
                  <span className="adm-modal-info-val">{statusCfg.label}</span>
                </div>
              </div>
              <div className="adm-modal-info-item full">
                <AlertCircle size={14} />
                <div className="adm-modal-info-item-inner">
                  <span className="adm-modal-info-lbl">Mã báo cáo SOS liên kết</span>
                  <span className="adm-modal-info-val" style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    {task.reportId || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          {(noteText || imageUrl) && (
            <div className="adm-modal-section">
              <div className="adm-modal-section-label"><FileText size={13} /> GHI CHÚ HOÀN THÀNH</div>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Ảnh xác minh hoàn thành"
                  className="adm-modal-proof-img"
                />
              )}
              {noteText && <p className="adm-modal-text-box">{noteText}</p>}
            </div>
          )}

          {/* Người thực hiện */}
          {task.userId && (
            <div className="adm-modal-section">
              <div className="adm-modal-section-label"><Hash size={13} /> TÌNH NGUYỆN VIÊN</div>
              <div className="adm-modal-info-item">
                <Loader2 size={14} />
                <div className="adm-modal-info-item-inner">
                  <span className="adm-modal-info-lbl">User ID</span>
                  <span className="adm-modal-info-val" style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    {task.userId}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="adm-modal-id-row">
            Task ID: <span>{task.id.substring(0, 12).toUpperCase()}...</span>
          </div>
        </div>

        {/* Footer */}
        <div className="adm-modal-footer">
          <button className="adm-modal-btn-close" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

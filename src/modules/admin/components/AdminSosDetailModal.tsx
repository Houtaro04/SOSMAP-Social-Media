import React from 'react';
import {
  X, MapPin, Clock, FileText,
  AlertCircle, HeartPulse, ShoppingBasket, Truck,
  CheckCircle, Navigation
} from 'lucide-react';
import type { SosReportItem } from '../viewmodels/useAdminDashboardViewModel';
import { STATUS_MAP, LEVEL_MAP } from '../viewmodels/useAdminDashboardViewModel';
import '@/styles/AdminDetailModals.css';

interface Props {
  report: SosReportItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  formatDate: (dt: string) => string;
}

const LEVEL_CONFIG: Record<string, { label: string; pillCls: string; icon: React.ReactNode }> = {
  URGENT:    { label: 'CẤP CỨU',  pillCls: 'urgent',    icon: <AlertCircle  size={13} /> },
  MEDICAL:   { label: 'Y TẾ',     pillCls: 'medical',   icon: <HeartPulse   size={13} /> },
  LOGISTICS: { label: 'HẬU CẦN', pillCls: 'logistics', icon: <ShoppingBasket size={13} /> },
  FLOOD:     { label: 'NGẬP LỤT', pillCls: 'flood',     icon: <Truck         size={13} /> },
  HIGH:      { label: 'CAO',      pillCls: 'urgent',    icon: <AlertCircle  size={13} /> },
  MEDIUM:    { label: 'TRUNG BÌNH', pillCls: 'logistics', icon: <ShoppingBasket size={13} /> },
  LOW:       { label: 'THẤP',     pillCls: 'flood',     icon: <CheckCircle  size={13} /> },
};

const STATUS_PILL: Record<string, string> = {
  PENDING:    'pending',
  APPROVED:   'approved',
  PROCESSING: 'processing',
  COMPLETED:  'completed',
  RESOLVED:   'completed',
  CLOSED:     'closed',
  CANCELLED:  'closed',
};

export const AdminSosDetailModal: React.FC<Props> = ({
  report, isOpen, onClose, onApprove, formatDate
}) => {
  if (!isOpen || !report) return null;

  const levelKey = (report.level || 'URGENT').toUpperCase();
  const statusKey = (report.status || 'PENDING').toUpperCase();
  const levelCfg = LEVEL_CONFIG[levelKey] || LEVEL_CONFIG['URGENT'];
  const statusCfg = STATUS_MAP[statusKey] || { label: statusKey, cls: 'badge-pending' };
  const pillCls = STATUS_PILL[statusKey] || 'pending';

  const lat = (report as any).latitude;
  const lng = (report as any).longitude;

  return (
    <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-modal-box">
        <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>

        {/* Header */}
        <div className="adm-modal-header">
          <div className="adm-modal-header-badges">
            <span className={`adm-mpill ${levelCfg.pillCls}`}>
              {levelCfg.icon} {levelCfg.label}
            </span>
            <span className={`adm-mpill ${pillCls}`}>{statusCfg.label}</span>
          </div>
          <h2 className="adm-modal-title">
            {report.details?.substring(0, 90) || 'Yêu cầu cứu trợ'}
            {(report.details?.length || 0) > 90 ? '...' : ''}
          </h2>
          <div className="adm-modal-subtitle">
            <Clock size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {formatDate(report.createdAt)}
          </div>
        </div>

        {/* Body */}
        <div className="adm-modal-body">

          {/* Mô tả đầy đủ */}
          {report.details && (
            <div className="adm-modal-section">
              <div className="adm-modal-section-label"><FileText size={13} /> MÔ TẢ TÌNH TRẠNG</div>
              <p className="adm-modal-text-box">{report.details}</p>
            </div>
          )}

          {/* Thông tin */}
          <div className="adm-modal-section">
            <div className="adm-modal-section-label"><MapPin size={13} /> THÔNG TIN ĐỊA ĐIỂM</div>
            <div className="adm-modal-info-grid">
              <div className="adm-modal-info-item full">
                <MapPin size={14} />
                <div className="adm-modal-info-item-inner">
                  <span className="adm-modal-info-lbl">Địa chỉ</span>
                  <span className="adm-modal-info-val">{report.address || '—'}</span>
                </div>
              </div>
              {lat && lng && (
                <div className="adm-modal-info-item full">
                  <Navigation size={14} />
                  <div className="adm-modal-info-item-inner">
                    <span className="adm-modal-info-lbl">Tọa độ GPS</span>
                    <a
                      className="adm-modal-link"
                      href={`https://www.google.com/maps?q=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)} ↗
                    </a>
                  </div>
                </div>
              )}
              <div className="adm-modal-info-item">
                <AlertCircle size={14} />
                <div className="adm-modal-info-item-inner">
                  <span className="adm-modal-info-lbl">Mức độ</span>
                  <span className="adm-modal-info-val">{levelCfg.label}</span>
                </div>
              </div>
              <div className="adm-modal-info-item">
                <CheckCircle size={14} />
                <div className="adm-modal-info-item-inner">
                  <span className="adm-modal-info-lbl">Trạng thái</span>
                  <span className="adm-modal-info-val">{statusCfg.label}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="adm-modal-id-row">
            Mã đơn: <span>#{report.id.substring(0, 8).toUpperCase()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="adm-modal-footer">
          <button className="adm-modal-btn-close" onClick={onClose}>Đóng</button>
          {statusKey === 'PENDING' && (
            <button
              className="adm-modal-btn-approve"
              onClick={() => { onApprove(report.id); onClose(); }}
            >
              <CheckCircle size={16} /> Phê duyệt báo cáo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

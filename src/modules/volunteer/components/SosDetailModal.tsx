import React from 'react';
import {
  X, MapPin, Clock, Phone, User, FileText,
  AlertCircle, HeartPulse, ShoppingBasket, Truck,
  Navigation, CheckCircle, Loader2
} from 'lucide-react';
import { SosReportResponse } from '@/shared/entities/SosEntity';
import '@/styles/SosDetailModal.css';

interface SosDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: SosReportResponse | null;
  /** ID của task đang hoạt động của volunteer */
  activeTaskReportId?: string | null;
  onAccept?: (reportId: string) => Promise<void>;
  onComplete?: () => void;
  isAccepting?: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  URGENT:    { label: 'CẤP CỨU',  icon: <AlertCircle  size={16} />, color: '#EF4444', bg: '#FEF2F2' },
  MEDICAL:   { label: 'Y TẾ',     icon: <HeartPulse   size={16} />, color: '#14B8A6', bg: '#F0FDFA' },
  LOGISTICS: { label: 'HẬU CẦN', icon: <ShoppingBasket size={16} />, color: '#F59E0B', bg: '#FFFBEB' },
  FLOOD:     { label: 'NGẬP LỤT', icon: <Truck         size={16} />, color: '#3B82F6', bg: '#EFF6FF' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: 'Chờ duyệt',     color: '#92400E', bg: '#FEF3C7' },
  APPROVED:   { label: 'Chờ tiếp nhận', color: '#92400E', bg: '#FEF3C7' },
  PROCESSING: { label: 'Đang xử lý',    color: '#1D4ED8', bg: '#EFF6FF' },
  COMPLETED:  { label: 'Hoàn thành',    color: '#065F46', bg: '#ECFDF5' },
  RESOLVED:   { label: 'Hoàn thành',    color: '#065F46', bg: '#ECFDF5' },
  DONE:       { label: 'Hoàn thành',    color: '#065F46', bg: '#ECFDF5' },
  CLOSED:     { label: 'Đã đóng',       color: '#374151', bg: '#F3F4F6' },
};

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

function formatTimeAgo(dateStr: string) {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    return `${Math.floor(diff / 1440)} ngày trước`;
  } catch { return dateStr; }
}

export const SosDetailModal: React.FC<SosDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  activeTaskReportId,
  onAccept,
  onComplete,
  isAccepting = false,
}) => {
  if (!isOpen || !request) return null;

  const levelKey  = (request.level  || 'URGENT').toUpperCase();
  const statusKey = (request.status || 'PENDING').toUpperCase();
  const typeCfg   = TYPE_CONFIG[levelKey]  || TYPE_CONFIG['URGENT'];
  const statusCfg = STATUS_CONFIG[statusKey] || { label: statusKey, color: '#374151', bg: '#F3F4F6' };

  const isMyTask    = activeTaskReportId === request.id;
  const isApproved  = statusKey === 'APPROVED';
  const isProcessing = statusKey === 'PROCESSING';
  const isDone      = ['COMPLETED', 'DONE', 'RESOLVED', 'CLOSED'].includes(statusKey);

  const openGoogleMaps = () => {
    if (request.latitude && request.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${request.latitude},${request.longitude}`,
        '_blank'
      );
    }
  };

  return (
    <div className="sdm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sdm-content">

        {/* Close button */}
        <button className="sdm-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* ── Header ── */}
        <div className="sdm-header" style={{ borderColor: typeCfg.color + '33' }}>
          <div className="sdm-header-top">
            <div className="sdm-type-pill" style={{ background: typeCfg.bg, color: typeCfg.color }}>
              {typeCfg.icon}
              <span>{typeCfg.label}</span>
            </div>
            <div className="sdm-status-pill" style={{ background: statusCfg.bg, color: statusCfg.color }}>
              {statusCfg.label}
            </div>
          </div>

          <h2 className="sdm-title">
            {request.details?.substring(0, 100) || 'Yêu cầu cứu trợ'}
            {(request.details?.length || 0) > 100 ? '...' : ''}
          </h2>

          <div className="sdm-time-row">
            <Clock size={14} />
            <span>{formatDateTime(request.createdAt)}</span>
            <span className="sdm-time-ago">({formatTimeAgo(request.createdAt)})</span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="sdm-body">

          {/* Mô tả đầy đủ */}
          {request.details && (
            <div className="sdm-section">
              <div className="sdm-section-label">
                <FileText size={15} />
                <span>MÔ TẢ TÌNH TRẠNG</span>
              </div>
              <p className="sdm-details-text">{request.details}</p>
            </div>
          )}

          {/* Địa chỉ */}
          <div className="sdm-section">
            <div className="sdm-section-label">
              <MapPin size={15} />
              <span>ĐỊA CHỈ CẦN CỨU TRỢ</span>
            </div>
            <div className="sdm-address-row">
              <span>{request.address || 'Chưa có địa chỉ'}</span>
              {request.latitude && request.longitude && (
                <button className="sdm-nav-btn" onClick={openGoogleMaps} title="Dẫn đường Google Maps">
                  <Navigation size={14} />
                  Dẫn đường
                </button>
              )}
            </div>
            {request.latitude && request.longitude && (
              <div className="sdm-coords">
                <CheckCircle size={13} />
                <span>Tọa độ GPS: {request.latitude.toFixed(6)}, {request.longitude.toFixed(6)}</span>
              </div>
            )}
          </div>

          {/* Thông tin liên hệ */}
          <div className="sdm-section">
            <div className="sdm-section-label">
              <User size={15} />
              <span>THÔNG TIN NGƯỜI YÊU CẦU</span>
            </div>
            <div className="sdm-contact-grid">
              {(request as any).fullName && (
                <div className="sdm-contact-item">
                  <User size={14} />
                  <div>
                    <span className="sdm-contact-lbl">Tên</span>
                    <span className="sdm-contact-val">{(request as any).fullName}</span>
                  </div>
                </div>
              )}
              {(request as any).phoneNumber && (
                <div className="sdm-contact-item">
                  <Phone size={14} />
                  <div>
                    <span className="sdm-contact-lbl">Số điện thoại</span>
                    <a href={`tel:${(request as any).phoneNumber}`} className="sdm-contact-val sdm-phone">
                      {(request as any).phoneNumber}
                    </a>
                  </div>
                </div>
              )}
              {!(request as any).fullName && !(request as any).phoneNumber && (
                <p className="sdm-anon-note">Người yêu cầu chọn ẩn danh</p>
              )}
            </div>
          </div>

          {/* ID Đơn */}
          <div className="sdm-id-row">
            Mã đơn: <span>#{request.id.substring(0, 8).toUpperCase()}</span>
          </div>
        </div>

        {/* ── Footer actions ── */}
        <div className="sdm-footer">
          <button className="sdm-btn-close" onClick={onClose}>
            Đóng
          </button>

          {isMyTask && !isDone && (
            <button className="sdm-btn-complete" onClick={() => { onClose(); onComplete?.(); }}>
              <CheckCircle size={16} />
              Xác nhận hoàn thành
            </button>
          )}

          {isApproved && !isMyTask && (
            <button
              className="sdm-btn-accept"
              onClick={() => onAccept?.(request.id)}
              disabled={isAccepting || !!activeTaskReportId}
              title={activeTaskReportId ? 'Bạn đang có nhiệm vụ khác chưa hoàn thành' : ''}
            >
              {isAccepting ? (
                <><Loader2 size={16} className="sdm-spin" /> Đang xử lý...</>
              ) : activeTaskReportId ? (
                'Đang có nhiệm vụ khác'
              ) : (
                'Tiếp nhận đơn này'
              )}
            </button>
          )}

          {isProcessing && !isMyTask && (
            <div className="sdm-btn-processing">
              <Loader2 size={16} className="sdm-spin" />
              Đang được xử lý
            </div>
          )}

          {isDone && (
            <div className="sdm-btn-done">
              <CheckCircle size={16} />
              Đã hoàn thành
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

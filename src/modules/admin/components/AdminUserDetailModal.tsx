import React from 'react';
import {
  X, User, Phone, Mail, MapPin,
  Calendar, Shield, Lock, Unlock, CheckCircle
} from 'lucide-react';
import '@/styles/AdminDetailModals.css';
import { ensureFullUrl } from '@/shared/services/profileService';
import { ROLE_LABEL, STATUS_LABEL } from '../viewmodels/useAdminUsersViewModel';
import type { FilterTab } from '../viewmodels/useAdminUsersViewModel';

// Reuse UserResponse shape from adminService
export interface AdminUserDetail {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  status: string;
  imageUrl?: string;
  createdAt: string;
  idCard?: string;
}

interface Props {
  user: AdminUserDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus: (user: AdminUserDetail) => void;
  formatDate: (dt: string) => string;
  actionLoading?: string | null;
}

const ROLE_PILL: Record<string, string> = {
  CITIZEN:   'role-citizen',
  VOLUNTEER: 'role-volunteer',
  ADMIN:     'role-admin',
};

const STATUS_PILL: Record<string, string> = {
  ACTIVE:  'st-active',
  BANNED:  'st-banned',
  INACTIVE:'st-banned',
  PENDING: 'st-pending',
};

export const AdminUserDetailModal: React.FC<Props> = ({
  user, isOpen, onClose, onToggleStatus, formatDate, actionLoading
}) => {
  if (!isOpen || !user) return null;

  const roleKey   = (user.role   || 'CITIZEN').toUpperCase();
  const statusKey = (user.status || 'ACTIVE').toUpperCase();
  const rolePill   = ROLE_PILL[roleKey]   || 'role-citizen';
  const statusPill = STATUS_PILL[statusKey] || 'st-active';
  const isLocked   = statusKey === 'BANNED' || statusKey === 'INACTIVE';
  const isActioning = actionLoading === user.id + '-status';

  return (
    <div
      className="adm-modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="adm-modal-box">
        <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>

        {/* Header */}
        <div className="adm-modal-header">
          <div className="adm-modal-header-badges">
            <span className={`adm-mpill ${rolePill}`}>
              <Shield size={12} /> {ROLE_LABEL[roleKey] || roleKey}
            </span>
            <span className={`adm-mpill ${statusPill}`}>
              {STATUS_LABEL[statusKey] || statusKey}
            </span>
          </div>
          <h2 className="adm-modal-title">Chi tiết tài khoản</h2>
          <div className="adm-modal-subtitle">
            <Calendar size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Đăng ký: {formatDate(user.createdAt)}
          </div>
        </div>

        {/* Body */}
        <div className="adm-modal-body">

          {/* Avatar + Name */}
          <div className="adm-modal-avatar-section">
            <div className="adm-modal-avatar">
              <img
                src={ensureFullUrl(user.imageUrl, user.fullName)}
                alt={user.fullName}
                onError={e => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerText =
                      user.fullName?.charAt(0)?.toUpperCase() || '?';
                  }
                }}
              />
            </div>
            <div className="adm-modal-avatar-info">
              <h3>{user.fullName || '—'}</h3>
              <p>{user.email || '—'}</p>
            </div>
          </div>

          {/* Contact details */}
          <div className="adm-modal-section">
            <div className="adm-modal-section-label"><User size={13} /> THÔNG TIN CÁ NHÂN</div>
            <div className="adm-modal-info-grid">
              <div className="adm-modal-info-item">
                <Phone size={14} />
                <div className="adm-modal-info-item-inner">
                  <span className="adm-modal-info-lbl">Số điện thoại</span>
                  <span className="adm-modal-info-val">
                    {user.phone ? (
                      <a href={`tel:${user.phone}`} className="adm-modal-link">{user.phone}</a>
                    ) : '—'}
                  </span>
                </div>
              </div>

              <div className="adm-modal-info-item">
                <Mail size={14} />
                <div className="adm-modal-info-item-inner">
                  <span className="adm-modal-info-lbl">Email</span>
                  <span className="adm-modal-info-val" style={{ fontSize: '0.82rem' }}>
                    {user.email || '—'}
                  </span>
                </div>
              </div>

              {user.address && (
                <div className="adm-modal-info-item full">
                  <MapPin size={14} />
                  <div className="adm-modal-info-item-inner">
                    <span className="adm-modal-info-lbl">Địa chỉ</span>
                    <span className="adm-modal-info-val">{user.address}</span>
                  </div>
                </div>
              )}

              {user.idCard && (
                <div className="adm-modal-info-item full">
                  <Shield size={14} />
                  <div className="adm-modal-info-item-inner">
                    <span className="adm-modal-info-lbl">CCCD / CMND</span>
                    <span className="adm-modal-info-val" style={{ fontFamily: 'monospace' }}>
                      {user.idCard}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="adm-modal-id-row">
            User ID: <span>{user.id.substring(0, 16).toUpperCase()}...</span>
          </div>
        </div>

        {/* Footer */}
        <div className="adm-modal-footer">
          <button className="adm-modal-btn-close" onClick={onClose}>Đóng</button>
          {isLocked ? (
            <button
              className="adm-modal-btn-unlock"
              onClick={() => { onToggleStatus(user); onClose(); }}
              disabled={isActioning}
            >
              <Unlock size={16} /> Mở khóa tài khoản
            </button>
          ) : (
            <button
              className="adm-modal-btn-lock"
              onClick={() => { onToggleStatus(user); onClose(); }}
              disabled={isActioning}
            >
              <Lock size={16} /> Khóa tài khoản
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

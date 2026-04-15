import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, PhoneCall, MessageSquare, X,
  Shield, Star, CheckCircle, Clock, Info
} from 'lucide-react';
import { useRescueViewModel } from '../viewmodels/useRescueViewModel';
import { messageService } from '@/shared/services/messageService';
import { ensureFullUrl } from '@/shared/services/profileService';
import type { VolunteerResponse } from '@/shared/entities/VolunteerEntity';
import '@/styles/RescueView.css';

/* ─── Team Detail Modal ─────────────────────────────────────────────────────── */
interface TeamDetailModalProps {
  volunteer: VolunteerResponse;
  onClose: () => void;
  onMessage: (v: VolunteerResponse) => void;
  isMessaging: boolean;
}

const TeamDetailModal: React.FC<TeamDetailModalProps> = ({ volunteer, onClose, onMessage, isMessaging }) => {
  const isActive = volunteer.status === 'ACTIVE';
  const initials = (volunteer.name || 'V').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="rescue-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rescue-modal">
        <button className="rescue-modal-close" onClick={onClose}><X size={20} /></button>

        {/* Header banner */}
        <div className={`rescue-modal-banner ${isActive ? 'active' : 'busy'}`}>
          <div className="rescue-modal-avatar">
            {volunteer.avatarUrl ? (
              <img src={ensureFullUrl(volunteer.avatarUrl, volunteer.name)} alt={volunteer.name} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className={`rescue-modal-status-badge ${isActive ? 'active' : 'busy'}`}>
            {isActive ? <><CheckCircle size={14} /> Đang hoạt động</> : <><Clock size={14} /> Đang bận</>}
          </div>
        </div>

        {/* Content */}
        <div className="rescue-modal-body">
          <h2 className="rescue-modal-name">{volunteer.name}</h2>

          {/* Info rows */}
          <div className="rescue-modal-info-list">
            {volunteer.phone && (
              <div className="rescue-modal-info-row">
                <PhoneCall size={16} className="rescue-modal-icon" />
                <span>{volunteer.phone}</span>
              </div>
            )}
            {volunteer.regions?.length > 0 && (
              <div className="rescue-modal-info-row">
                <MapPin size={16} className="rescue-modal-icon" />
                <span>{volunteer.regions.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Skills */}
          {volunteer.skills?.length > 0 && (
            <div className="rescue-modal-section">
              <p className="rescue-modal-section-label"><Star size={14} /> Kỹ năng</p>
              <div className="rescue-modal-skills">
                {volunteer.skills.map((skill, i) => (
                  <span className="rescue-skill-tag" key={i}>{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="rescue-modal-actions">
            <button
              className="rescue-modal-btn message"
              onClick={() => onMessage(volunteer)}
              disabled={isMessaging}
            >
              {isMessaging ? (
                <><span className="rescue-btn-spinner" /> Đang kết nối...</>
              ) : (
                <><MessageSquare size={18} /> Nhắn tin</>
              )}
            </button>
            <button
              className={`rescue-modal-btn call ${!isActive ? 'disabled' : ''}`}
              disabled={!isActive}
            >
              <PhoneCall size={18} />
              {isActive ? 'Gọi ngay' : 'Đang bận'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export const RescueView: React.FC = () => {
  const { searchQuery, setSearchQuery, volunteers, isLoading } = useRescueViewModel();
  const navigate = useNavigate();

  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerResponse | null>(null);
  const [isMessaging, setIsMessaging] = useState(false);

  const handleOpenDetail = (v: VolunteerResponse) => setSelectedVolunteer(v);
  const handleCloseModal = () => setSelectedVolunteer(null);

  const handleMessageVolunteer = useCallback(async (v: VolunteerResponse) => {
    setIsMessaging(true);
    try {
      const { data: conv } = await messageService.getOrCreatePrivate(v.id);
      if (conv?.id) {
        navigate(`/citizen/messages?convId=${conv.id}`);
      } else {
        navigate('/citizen/messages');
      }
    } catch (e) {
      console.error('[RescueView] message error:', e);
      navigate('/citizen/messages');
    } finally {
      setIsMessaging(false);
      setSelectedVolunteer(null);
    }
  }, [navigate]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
  };

  return (
    <div className="rescue-view-container">
      {/* HEADER */}
      <div className="rescue-header">
        <div className="rescue-header-title">
          <Shield size={28} className="rescue-header-icon" />
          <div>
            <h1>Danh sách đội cứu hộ</h1>
            <p>Các đội đang hoạt động và sẵn sàng hỗ trợ bạn.</p>
          </div>
        </div>
        <div className="rescue-search">
          <div className="search-input-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm đội, khu vực..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TEAM GRID */}
      {isLoading ? (
        <div className="rescue-loading">
          <div className="rescue-spinner" />
          <p>Đang tải danh sách đội cứu hộ...</p>
        </div>
      ) : (
        <div className="rescue-grid">
          {volunteers.length === 0 ? (
            <div className="rescue-empty">
              <Shield size={48} />
              <p>Không tìm thấy kết quả phù hợp.</p>
            </div>
          ) : (
            volunteers.map(r => {
              const isActive = r.status === 'ACTIVE';
              const initials = (r.name || 'V').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div className="team-card" key={r.id}>
                  {/* Banner */}
                  <div className="team-card-banner">
                    <div className="team-card-avatar">
                      {r.avatarUrl ? (
                        <img
                          src={ensureFullUrl(r.avatarUrl, r.name)}
                          alt={r.name}
                          onError={handleImageError}
                        />
                      ) : (
                        <span className="team-card-initials">{initials}</span>
                      )}
                    </div>
                    <div className={`status-badge ${isActive ? 'active' : 'busy'}`}>
                      {isActive ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {isActive ? 'Đang hoạt động' : 'Đang bận'}
                    </div>
                  </div>

                  <div className="team-card-content">
                    <h3 className="team-name">{r.name}</h3>

                    {r.regions?.length > 0 && (
                      <div className="team-region">
                        <MapPin size={14} className="region-icon" />
                        <span>{r.regions.slice(0, 2).join(', ')}{r.regions.length > 2 ? '...' : ''}</span>
                      </div>
                    )}

                    {r.skills?.length > 0 && (
                      <div className="team-skills">
                        {r.skills.slice(0, 3).map((skill, idx) => (
                          <span className="skill-tag" key={idx}>{skill}</span>
                        ))}
                      </div>
                    )}

                    <div className="team-actions">
                      <button
                        className="btn-detail"
                        onClick={() => handleOpenDetail(r)}
                      >
                        <Info size={16} /> Xem chi tiết
                      </button>
                      <button
                        className="btn-message"
                        onClick={() => handleMessageVolunteer(r)}
                        title="Nhắn tin"
                      >
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedVolunteer && (
        <TeamDetailModal
          volunteer={selectedVolunteer}
          onClose={handleCloseModal}
          onMessage={handleMessageVolunteer}
          isMessaging={isMessaging}
        />
      )}
    </div>
  );
};

export default RescueView;

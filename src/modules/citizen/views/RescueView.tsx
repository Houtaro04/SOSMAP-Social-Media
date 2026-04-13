import React from 'react';
import { Search, MapPin, PhoneCall } from 'lucide-react';
import { useRescueViewModel } from '../viewmodels/useRescueViewModel';
import '@/styles/RescueView.css';

export const RescueView: React.FC = () => {
  const { searchQuery, setSearchQuery, volunteers: volunteers = [], isLoading } = useRescueViewModel();

  return (
    <div className="rescue-view-container">
      {/* HEADER SECTION */}
      <div className="rescue-header">
        <div className="rescue-header-title">
          <h1>Tìm kiếm sự trợ giúp</h1>
          <p>Danh sách các đơn vị cứu hộ đang hoạt động và sẵn sàng hỗ trợ bạn.</p>
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

      {/* TEAM DIRECTORY GRID */}
      {isLoading ? (
        <div className="rescue-loading">Đang tải danh sách đội cứu hộ...</div>
      ) : (
        <div className="rescue-grid">
          {volunteers.length === 0 ? (
            <div className="rescue-empty">Không tìm thấy kết quả phù hợp.</div>
          ) : (
            volunteers.map(r => (
              <div className="team-card" key={r.id}>

                {/* Image / Avatar Header Placeholder */}
                <div className="team-card-banner">
                  <div className={`status-badge ${r.status === 'ACTIVE' ? 'active' : 'busy'}`}>
                    {r.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đang bận'}
                  </div>
                </div>

                <div className="team-card-content">
                  <h3 className="team-name">{r.name}</h3>

                  <div className="team-region">
                    <MapPin size={16} className="region-icon" />
                    <span>{r.regions?.join(', ') || 'N/A'}</span>
                  </div>

                  <div className="team-skills">
                    {r.skills?.map((skill, idx) => (
                      <span className="skill-tag" key={idx}>{skill}</span>
                    ))}
                  </div>

                  <div className="team-actions">
                    <button
                      className={`btn-call ${r.status !== 'ACTIVE' ? 'disabled' : ''}`}
                      disabled={r.status !== 'ACTIVE'}
                    >
                      <PhoneCall size={18} />
                      {r.status === 'ACTIVE' ? 'Gọi ngay' : 'Đang bận'}
                    </button>
                    <button className="btn-message">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default RescueView;

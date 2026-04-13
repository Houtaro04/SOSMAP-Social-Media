import React, { useState } from 'react';
import {
  Search, MapPin, Clock, CheckCircle,
  AlertCircle, HeartPulse, ShoppingBasket, Truck,
  ChevronDown, Filter, Bell
} from 'lucide-react';
import '@/styles/VolunteerRequestsView.css';

type RequestType = 'ALL' | 'URGENT' | 'MEDICAL' | 'FOOD' | 'EVACUATION';
type RequestStatus = 'PENDING' | 'PROCESSING' | 'DONE';

interface Volunteerequest {
  id: string;
  type: 'URGENT' | 'MEDICAL' | 'FOOD' | 'EVACUATION';
  urgency: 'CẤP BÁCH' | 'QUAN TRỌNG' | 'BÌNH THƯỜNG';
  title: string;
  description: string;
  location: string;
  distance: string;
  timeAgo: string;
  status: RequestStatus;
  requester: string;
  peopleCount?: number;
}

const MOCK_REQUESTS: Volunteerequest[] = [
  {
    id: '1', type: 'URGENT', urgency: 'CẤP BÁCH',
    title: 'Cần thuyền cứu hộ khẩn cấp',
    description: 'Có 3 người già bị mắc kẹt trên mái nhà do nước lên nhanh. Cần can thiệp ngay!',
    location: 'Đội 4, thôn Trung, xã Duy Vinh, Quảng Nam',
    distance: '1.2 km', timeAgo: 'Vừa xong', status: 'PENDING',
    requester: 'Nguyễn Thị Hoa', peopleCount: 3
  },
  {
    id: '2', type: 'MEDICAL', urgency: 'CẤP BÁCH',
    title: 'Cấp cứu: Người già khó thở',
    description: 'Ông Trần Văn Nam, 78 tuổi, khó thở, không liên hệ được cơ sở y tế. Cần thuốc và hỗ trợ di chuyển.',
    location: 'Hẻm 12, đường Lê Lợi, Liên Chiểu, Đà Nẵng',
    distance: '2.4 km', timeAgo: '5 phút trước', status: 'PENDING',
    requester: 'Lê Thị Mai', peopleCount: 1
  },
  {
    id: '3', type: 'FOOD', urgency: 'QUAN TRỌNG',
    title: 'Thiếu nước sạch và lương khô',
    description: 'Khu dân cư 20 hộ cạn kiệt nguồn nước uống và thực phẩm từ hôm qua. Đường vào bị ngập.',
    location: 'Đường Hoàng Văn Thái, Cẩm Lệ, Đà Nẵng',
    distance: '3.1 km', timeAgo: '12 phút trước', status: 'PROCESSING',
    requester: 'Phạm Quang Huy', peopleCount: 20
  },
  {
    id: '4', type: 'EVACUATION', urgency: 'CẤP BÁCH',
    title: 'Di tản khẩn cấp khu ngập sâu',
    description: 'Toàn bộ khu vực ngập hơn 1.5m, 8 gia đình không tự sơ tán được. Có trẻ em và phụ nữ mang thai.',
    location: 'Thôn Phú Lộc, xã Duy Thành, Quảng Nam',
    distance: '4.8 km', timeAgo: '18 phút trước', status: 'PENDING',
    requester: 'Trần Minh Tuấn', peopleCount: 8
  },
  {
    id: '5', type: 'MEDICAL', urgency: 'QUAN TRỌNG',
    title: 'Cần thuốc hạ sốt cho trẻ em',
    description: 'Trẻ 5 tuổi sốt cao 39.5°C, không có thuốc dự trữ. Cha mẹ không thể ra ngoài do đường bị ngập.',
    location: 'Ngõ 7, đường Nguyễn Lương Bằng, Hải Châu',
    distance: '5.6 km', timeAgo: '25 phút trước', status: 'PENDING',
    requester: 'Đinh Thị Lan'
  },
  {
    id: '6', type: 'FOOD', urgency: 'BÌNH THƯỜNG',
    title: 'Cần mì tôm và đồ khô',
    description: '5 hộ dân trong khu cô lập đã 2 ngày không có lương thực. Sức khỏe ổn, không khẩn cấp.',
    location: 'Xã Điện Thắng Trung, Điện Bàn, Quảng Nam',
    distance: '7.2 km', timeAgo: '1 giờ trước', status: 'DONE',
    requester: 'Nguyễn Văn Bình', peopleCount: 5
  },
];

const TYPE_CONFIG = {
  URGENT: { label: 'CẤP CỨU', icon: <AlertCircle size={14} />, color: 'type-urgent' },
  MEDICAL: { label: 'Y TẾ', icon: <HeartPulse size={14} />, color: 'type-medical' },
  FOOD: { label: 'THỰC PHẨM', icon: <ShoppingBasket size={14} />, color: 'type-food' },
  EVACUATION: { label: 'DI TẢN', icon: <Truck size={14} />, color: 'type-evacuation' },
};

const URGENCY_CONFIG = {
  'CẤP BÁCH': 'urgency-high',
  'QUAN TRỌNG': 'urgency-medium',
  'BÌNH THƯỜNG': 'urgency-low',
};

const STATUS_CONFIG: Record<RequestStatus, { label: string; cls: string }> = {
  PENDING: { label: 'Chờ tiếp nhận', cls: 'status-pending' },
  PROCESSING: { label: 'Đang xử lý', cls: 'status-processing' },
  DONE: { label: 'Hoàn thành', cls: 'status-done' },
};

export const VolunteerRequestsView: React.FC = () => {
  const [filterType, setFilterType] = useState<RequestType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState(MOCK_REQUESTS);

  const filtered = requests.filter(r => {
    const matchType = filterType === 'ALL' || r.type === filterType;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.location.toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  const handleAccept = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'PROCESSING' } : r));
  };

  return (
    <div className="rr-container">
      {/* PAGE HEADER */}
      <div className="rr-header">
        <div className="rr-header-left">
          <h1 className="rr-title">Yêu cầu cứu trợ</h1>
          <p className="rr-subtitle">Theo dõi và tiếp nhận các yêu cầu hỗ trợ khẩn cấp</p>
        </div>
        <div className="rr-header-right">
          <div className="rr-alert-badge">
            <Bell size={18} />
            <span>{pendingCount} yêu cầu mới</span>
          </div>
        </div>
      </div>

      {/* SEARCH + FILTER BAR */}
      <div className="rr-toolbar">
        <div className="rr-search">
          <Search size={18} className="rr-search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm yêu cầu, địa chỉ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="rr-filters">
          {([
            ['ALL', 'Tất cả'],
            ['URGENT', 'Cấp cứu'],
            ['MEDICAL', 'Y tế'],
            ['FOOD', 'Thực phẩm'],
            ['EVACUATION', 'Di tản'],
          ] as [RequestType, string][]).map(([type, label]) => (
            <button
              key={type}
              className={`rr-filter-btn ${filterType === type ? 'active' : ''} filter-${type.toLowerCase()}`}
              onClick={() => setFilterType(type)}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="rr-sort-btn">
          <Filter size={16} /> Sắp xếp <ChevronDown size={14} />
        </button>
      </div>

      {/* STATS ROW */}
      <div className="rr-stats">
        <div className="rr-stat-item urgent">
          <span className="stat-num">{requests.filter(r => r.urgency === 'CẤP BÁCH').length}</span>
          <span className="stat-lbl">Cấp bách</span>
        </div>
        <div className="rr-stat-item pending">
          <span className="stat-num">{pendingCount}</span>
          <span className="stat-lbl">Chờ tiếp nhận</span>
        </div>
        <div className="rr-stat-item processing">
          <span className="stat-num">{requests.filter(r => r.status === 'PROCESSING').length}</span>
          <span className="stat-lbl">Đang xử lý</span>
        </div>
        <div className="rr-stat-item done">
          <span className="stat-num">{requests.filter(r => r.status === 'DONE').length}</span>
          <span className="stat-lbl">Hoàn thành</span>
        </div>
      </div>

      {/* RESULTS COUNT */}
      <div className="rr-result-info">
        Hiển thị <strong>{filtered.length}</strong> / {requests.length} yêu cầu
      </div>

      {/* REQUEST GRID */}
      <div className="rr-grid">
        {filtered.map(req => {
          const typeCfg = TYPE_CONFIG[req.type];
          const statusCfg = STATUS_CONFIG[req.status];
          return (
            <div key={req.id} className={`rr-card ${req.urgency === 'CẤP BÁCH' ? 'card-urgent' : ''}`}>
              {/* Card Header */}
              <div className="rr-card-header">
                <div className="rr-card-badges">
                  <span className={`rr-type-badge ${typeCfg.color}`}>
                    {typeCfg.icon} {typeCfg.label}
                  </span>
                  <span className={`rr-urgency-badge ${URGENCY_CONFIG[req.urgency]}`}>
                    {req.urgency}
                  </span>
                </div>
                <span className={`rr-status-badge ${statusCfg.cls}`}>
                  {statusCfg.label}
                </span>
              </div>

              {/* Card Body */}
              <div className="rr-card-body">
                <h3 className="rr-card-title">{req.title}</h3>
                <p className="rr-card-desc">{req.description}</p>
              </div>

              {/* Card Meta */}
              <div className="rr-card-meta">
                <div className="meta-row">
                  <MapPin size={14} />
                  <span>{req.location}</span>
                </div>
                <div className="meta-row">
                  <Clock size={14} />
                  <span>{req.timeAgo}</span>
                  <span className="meta-distance">· {req.distance}</span>
                </div>
                {req.peopleCount && (
                  <div className="meta-row">
                    <CheckCircle size={14} />
                    <span>{req.peopleCount} người cần hỗ trợ</span>
                  </div>
                )}
                <div className="meta-row requester-row">
                  <div className="requester-avatar">{req.requester.charAt(0)}</div>
                  <span>{req.requester}</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="rr-card-actions">
                <button className="btn-detail">Xem chi tiết</button>
                {req.status === 'PENDING' && (
                  <button
                    className="btn-accept"
                    onClick={() => handleAccept(req.id)}
                  >
                    Tiếp nhận
                  </button>
                )}
                {req.status === 'PROCESSING' && (
                  <button className="btn-processing" disabled>
                    Đang xử lý...
                  </button>
                )}
                {req.status === 'DONE' && (
                  <button className="btn-done" disabled>
                    ✓ Hoàn thành
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rr-empty">
          <AlertCircle size={48} />
          <h3>Không tìm thấy yêu cầu</h3>
          <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      )}
    </div>
  );
};

export default VolunteerRequestsView;


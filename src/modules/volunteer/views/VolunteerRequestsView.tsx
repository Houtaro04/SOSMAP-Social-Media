import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, MapPin, Clock, CheckCircle,
  AlertCircle, HeartPulse, ShoppingBasket, Truck,
  ChevronDown, Filter, Bell, RefreshCw
} from 'lucide-react';
import '@/styles/VolunteerRequestsView.css';
import { sosService } from '@/shared/services/sosService';
import { rescueTaskService } from '@/shared/services/rescueTaskService';
import { useAuthStore } from '@/store/authStore';
import { SosReportResponse } from '@/shared/entities/SosEntity';
import { RescueTaskEntity } from '@/shared/entities/RescueTaskEntity';
import { CompleteTaskModal } from '../components/CompleteTaskModal';
import { SosDetailModal } from '../components/SosDetailModal';

type FilterType = 'ALL' | 'URGENT' | 'MEDICAL' | 'LOGISTICS' | 'FLOOD';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  URGENT:    { label: 'CẤP CỨU',   icon: <AlertCircle size={14} />,    color: 'type-urgent' },
  MEDICAL:   { label: 'Y TẾ',      icon: <HeartPulse size={14} />,     color: 'type-medical' },
  LOGISTICS: { label: 'HẬU CẦN',   icon: <ShoppingBasket size={14} />, color: 'type-food' },
  FLOOD:     { label: 'NGẬP LỤT',  icon: <Truck size={14} />,          color: 'type-evacuation' },
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: 'Chờ duyệt',    cls: 'status-pending' },
  APPROVED:   { label: 'Chờ tiếp nhận', cls: 'status-pending' },
  PROCESSING: { label: 'Đang xử lý',    cls: 'status-processing' },
  COMPLETED:  { label: 'Hoàn thành',    cls: 'status-done' },
  RESOLVED:   { label: 'Hoàn thành',    cls: 'status-done' },
  DONE:       { label: 'Hoàn thành',    cls: 'status-done' },
  CLOSED:     { label: 'Đã đóng',       cls: 'status-done' },
};

function formatTimeAgo(dateStr: string) {
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    return `${Math.floor(diff / 1440)} ngày trước`;
  } catch { return dateStr; }
}

export const VolunteerRequestsView: React.FC = () => {
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState<SosReportResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<RescueTaskEntity | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SosReportResponse | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const { user } = useAuthStore();

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await sosService.getSosReports();
      // Sắp xếp mới nhất lên đầu
      const sorted = [...data].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRequests(sorted);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadActiveTask = useCallback(async () => {
    if (user?.id) {
      const { data } = await rescueTaskService.getMyActiveTask(user.id);
      setActiveTask(data);
    }
  }, [user?.id]);

  useEffect(() => { 
    loadRequests(); 
    loadActiveTask();
  }, [loadRequests, loadActiveTask]);

  const handleAcceptSos = async (reportId: string) => {
    if (!user?.id) return;
    if (activeTask) {
      alert('Bạn hiện đang có một nhiệm vụ khác đang thực hiện. Vui lòng hoàn thành hoặc hủy nhiệm vụ đó trước khi nhận nhiệm vụ mới!');
      return;
    }
    setIsAccepting(true);
    try {
      const res = await rescueTaskService.createTask(reportId);
      if (res.success) {
        await sosService.updateStatus(reportId, 'PROCESSING');
        await loadRequests();
        await loadActiveTask();
        setSelectedRequest(null); // đóng modal sau khi tiếp nhận
      } else {
        alert(res.error || 'Không thể tiếp nhận đơn này');
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCompleteSuccess = async () => {
    await loadRequests();
    await loadActiveTask();
    setShowCompleteModal(false);
  };

  const filtered = requests.filter(r => {
    // Chỉ hiển thị các đơn đã được duyệt (không hiện PENDING)
    if (r.status === 'PENDING') return false;

    const levelUpper = (r.level || '').toUpperCase();
    const matchType = filterType === 'ALL' || levelUpper === filterType;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      (r.details || '').toLowerCase().includes(q) ||
      (r.address || '').toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const availableRequests = requests.filter(r => r.status !== 'PENDING');
  const pendingCount      = availableRequests.filter(r => r.status === 'APPROVED').length;
  const processingCount   = availableRequests.filter(r => r.status === 'PROCESSING').length;
  const doneCount         = availableRequests.filter(r => ['COMPLETED', 'DONE', 'RESOLVED', 'CLOSED'].includes(r.status)).length;

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
          <button
            onClick={loadRequests}
            disabled={isLoading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
            title="Tải lại"
          >
            <RefreshCw size={18} style={{ color: '#6b7280', animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
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
            ['LOGISTICS', 'Hậu cần'],
            ['FLOOD', 'Ngập lụt'],
          ] as [FilterType, string][]).map(([type, label]) => (
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
          <span className="stat-num">{requests.filter(r => (r.level || '').toUpperCase() === 'URGENT').length}</span>
          <span className="stat-lbl">Cấp bách</span>
        </div>
        <div className="rr-stat-item pending">
          <span className="stat-num">{pendingCount}</span>
          <span className="stat-lbl">Chờ tiếp nhận</span>
        </div>
        <div className="rr-stat-item processing">
          <span className="stat-num">{processingCount}</span>
          <span className="stat-lbl">Đang xử lý</span>
        </div>
        <div className="rr-stat-item done">
          <span className="stat-num">{doneCount}</span>
          <span className="stat-lbl">Hoàn thành</span>
        </div>
      </div>

      {/* RESULTS COUNT */}
      <div className="rr-result-info">
        Hiển thị <strong>{filtered.length}</strong> / {requests.length} yêu cầu
      </div>

      {/* LOADING */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Đang tải dữ liệu...
        </div>
      )}

      {/* REQUEST GRID */}
      {!isLoading && (
        <div className="rr-grid">
          {filtered.map(req => {
            const levelKey = (req.level || 'URGENT').toUpperCase();
            const typeCfg = TYPE_CONFIG[levelKey] || TYPE_CONFIG['URGENT'];
            const statusKey = (req.status || 'PENDING').toUpperCase();
            const statusCfg = STATUS_LABEL[statusKey] || { label: statusKey, cls: 'status-pending' };
            return (
              <div key={req.id} className={`rr-card ${levelKey === 'URGENT' ? 'card-urgent' : ''}`}>
                {/* Card Header */}
                <div className="rr-card-header">
                  <div className="rr-card-badges">
                    <span className={`rr-type-badge ${typeCfg.color}`}>
                      {typeCfg.icon} {typeCfg.label}
                    </span>
                  </div>
                  <span className={`rr-status-badge ${statusCfg.cls}`}>
                    {statusCfg.label}
                  </span>
                </div>

                {/* Card Body */}
                <div className="rr-card-body">
                  <h3 className="rr-card-title">{req.details?.substring(0, 80) || 'Yêu cầu cứu trợ'}</h3>
                </div>

                {/* Card Meta */}
                <div className="rr-card-meta">
                  <div className="meta-row">
                    <MapPin size={14} />
                    <span>{req.address || '—'}</span>
                  </div>
                  <div className="meta-row">
                    <Clock size={14} />
                    <span>{req.createdAt ? formatTimeAgo(req.createdAt) : '—'}</span>
                  </div>
                  {req.latitude && req.longitude && (
                    <div className="meta-row">
                      <CheckCircle size={14} />
                      <span>Có tọa độ định vị</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="rr-card-actions">
                  <button className="btn-detail" onClick={() => setSelectedRequest(req)}>Xem chi tiết</button>
                  {activeTask?.reportId === req.id ? (
                    <button 
                      className="btn-complete-task"
                      onClick={() => setShowCompleteModal(true)}
                    >
                      Xác nhận hoàn thành
                    </button>
                  ) : (
                    statusKey === 'APPROVED' && (
                      <button 
                        className={`btn-accept ${activeTask ? 'disabled' : ''}`}
                        onClick={() => handleAcceptSos(req.id)}
                        disabled={!!activeTask}
                        title={activeTask ? 'Bạn đang có nhiệm vụ khác chưa hoàn thành' : ''}
                      >
                        Tiếp nhận
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rr-empty">
          <AlertCircle size={48} />
          <h3>Không tìm thấy yêu cầu</h3>
          <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      )}

      {activeTask && (
        <CompleteTaskModal
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          taskId={activeTask.id}
          reportId={activeTask.reportId}
          onSuccess={handleCompleteSuccess}
        />
      )}

      <SosDetailModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        activeTaskReportId={activeTask?.reportId ?? null}
        onAccept={handleAcceptSos}
        onComplete={() => { setSelectedRequest(null); setShowCompleteModal(true); }}
        isAccepting={isAccepting}
      />
    </div>
  );
};

export default VolunteerRequestsView;

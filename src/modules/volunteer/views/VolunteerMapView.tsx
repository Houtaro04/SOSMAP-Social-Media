import React from 'react';
import { Map, Marker, NavigationControl, Source, Layer } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Search, Crosshair, AlertTriangle, HeartPulse,
  Truck, MapPin, Clock, ChevronRight, Layers, X
} from 'lucide-react';
import '@/styles/VolunteerMapView.css';
import { useVolunteerMapViewModel } from '../viewmodels/useVolunteerMapViewModel';
import { CompleteTaskModal } from '../components/CompleteTaskModal';

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const INCIDENT_COLORS = {
  URGENT: '#EF4444',
  MEDICAL: '#14B8A6',
  LOGISTICS: '#F59E0B',
  FLOOD: '#3B82F6',
};

const INCIDENT_ICONS: Record<string, React.ReactNode> = {
  URGENT: <AlertTriangle size={14} color="white" />,
  MEDICAL: <HeartPulse size={14} color="white" />,
  LOGISTICS: <Truck size={14} color="white" />,
  FLOOD: <MapPin size={14} color="white" />,
};

const LEGEND_ITEMS = [
  { color: '#EF4444', label: 'Cấp bách / Sơ tán' },
  { color: '#14B8A6', label: 'Y tế khẩn cấp' },
  { color: '#F59E0B', label: 'Hậu cần / Thực phẩm' },
  { color: '#3B82F6', label: 'Khu vực ngập lụt' },
];

const STATUS_CONFIG = {
  ACTIVE: { label: 'Chờ phản hồi', cls: 'inc-active' },
  RESPONDING: { label: 'Đang tiếp cận', cls: 'inc-responding' },
  RESOLVED: { label: 'Đã giải quyết', cls: 'inc-resolved' },
};

export const VolunteerMapView: React.FC = () => {
  const {
    viewState, setViewState,
    searchQuery, setSearchQuery,
    selectedIncident, setSelectedIncident,
    showLegend, setShowLegend,
    userLocation,
    filteredIncidents,
    handleLocate,
    handleSelectIncident,
    handleRouteToIncident,
    handleAcceptSos,
    activeTask,
    showCompleteModal,
    setShowCompleteModal,
    handleCompleteSuccess,
    routeData
  } = useVolunteerMapViewModel();

  return (
    <div className="rm-container">
      {/* BASE MAP */}
      <Map
        {...viewState}
        onMove={e => setViewState(e.viewState)}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        mapStyle={MAP_STYLE}
      >
        <NavigationControl position="bottom-left" />

        {/* User location */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="rm-user-dot">
              <div className="rm-user-pulse" />
            </div>
          </Marker>
        )}

        {/* Incident markers */}
        {filteredIncidents.map(inc => (
          <Marker
            key={inc.id}
            longitude={inc.lng}
            latitude={inc.lat}
            anchor="center"
            onClick={() => handleSelectIncident(inc)}
          >
            <div
              className={`rm-incident-marker ${inc.status === 'ACTIVE' ? 'marker-pulse' : ''} ${selectedIncident?.id === inc.id ? 'marker-pulse' : ''}`}
              style={{ background: INCIDENT_COLORS[inc.type] || '#EF4444' }}
              title={inc.title}
            >
              {INCIDENT_ICONS[inc.type] || INCIDENT_ICONS['URGENT']}
            </div>
          </Marker>
        ))}

        {routeData && (
          <Source id="route-source" type="geojson" data={routeData}>
            <Layer
              id="route-layer"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#3B82F6',
                'line-width': 4,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}
      </Map>

      {/* TOP SEARCH BAR */}
      <div className="rm-topbar">
        <div className="rm-search">
          <Search size={16} className="rm-search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm sự cố, khu vực..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="rm-stats-chips">
          <span className="rm-chip active">{filteredIncidents.filter(i => i.status === 'ACTIVE').length} Đang chờ</span>
          <span className="rm-chip responding">{filteredIncidents.filter(i => i.status === 'RESPONDING').length} Đang xử lý</span>
        </div>
      </div>

      {/* LOCATE BUTTON */}
      <button className="rm-locate-btn" onClick={handleLocate}>
        <Crosshair size={18} />
      </button>

      {/* LEGEND TOGGLE */}
      <button className="rm-legend-toggle" onClick={() => setShowLegend(!showLegend)}>
        <Layers size={18} />
      </button>

      {/* LEGEND PANEL */}
      {showLegend && (
        <div className="rm-legend">
          <div className="rm-legend-title">Chú giải bản đồ</div>
          {LEGEND_ITEMS.map(item => (
            <div key={item.color} className="rm-legend-item">
              <div className="rm-legend-dot" style={{ background: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
          <div className="rm-legend-item">
            <div className="rm-legend-dot user-dot-legend" />
            <span>Vị trí của bạn</span>
          </div>
        </div>
      )}

      {/* RIGHT PANEL: INCIDENT LIST */}
      <div className="rm-panel">
        <div className="rm-panel-header">
          <h3>Sự cố đang hoạt động</h3>
          <span className="rm-panel-count">{filteredIncidents.length}</span>
        </div>

        <div className="rm-incident-list">
          {filteredIncidents.map(inc => {
            const statusCfg = STATUS_CONFIG[inc.status];
            return (
              <div
                key={inc.id}
                className={`rm-incident-item ${selectedIncident?.id === inc.id ? 'selected' : ''}`}
                onClick={() => handleSelectIncident(inc)}
              >
                <div
                  className="rm-inc-color-bar"
                  style={{ background: INCIDENT_COLORS[inc.type] }}
                />
                <div className="rm-inc-content">
                  <div className="rm-inc-top">
                    <h4>{inc.title}</h4>
                    <span className={`rm-inc-status ${statusCfg.cls}`}>{statusCfg.label}</span>
                  </div>
                  <div className="rm-inc-meta">
                    <span><MapPin size={12} /> {inc.location}</span>
                    <span><Clock size={12} /> {inc.timeAgo}</span>
                    <span>· {inc.distance}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="rm-inc-arrow" />
              </div>
            );
          })}
        </div>

        {/* SELECTED INCIDENT DETAIL */}
        {selectedIncident && (
          <div className="rm-incident-detail">
            <div className="rm-detail-header">
              <div
                className="rm-detail-type-dot"
                style={{ background: INCIDENT_COLORS[selectedIncident.type] }}
              />
              <span className="rm-detail-type">{selectedIncident.type}</span>
              <button className="rm-detail-close" onClick={() => setSelectedIncident(null)}>
                <X size={16} />
              </button>
            </div>
            <h4 className="rm-detail-title">{selectedIncident.title}</h4>
            <div className="rm-detail-info">
              <MapPin size={14} /> {selectedIncident.location}
            </div>
            <div className="rm-detail-info">
              <Clock size={14} /> {selectedIncident.timeAgo} · {selectedIncident.distance}
            </div>
            <div className="rm-detail-actions">
              <button className="rm-btn-route" onClick={handleRouteToIncident}>📍 Dẫn đường</button>
              
              {activeTask?.reportId === selectedIncident.id ? (
                <button 
                  className="rm-btn-complete" 
                  onClick={() => setShowCompleteModal(true)}
                >
                  ✓ Hoàn thành
                </button>
              ) : (
                <button 
                  className={`rm-btn-accept ${activeTask ? 'disabled' : ''}`} 
                  onClick={handleAcceptSos}
                  disabled={!!activeTask}
                  title={activeTask ? 'Bạn đang có nhiệm vụ khác chưa hoàn thành' : ''}
                >
                  Tiếp nhận
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {activeTask && (
        <CompleteTaskModal
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          taskId={activeTask.id}
          reportId={activeTask.reportId}
          onSuccess={handleCompleteSuccess}
        />
      )}
    </div>
  );
};

export default VolunteerMapView;


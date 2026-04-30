import React from 'react';
import { Map, Marker, NavigationControl, Source, Layer } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Search, Crosshair, AlertTriangle, HeartPulse,
  Truck, MapPin, Clock, ChevronRight, Layers, X,
  ShieldCheck, Trash2, ChevronLeft, List
} from 'lucide-react';
import '@/styles/VolunteerMapView.css';
import '@/styles/SafetyPointModal.css';
import { useVolunteerMapViewModel } from '../viewmodels/useVolunteerMapViewModel';
import { CompleteTaskModal } from '../components/CompleteTaskModal';
import { SafetyPointModal } from '../components/SafetyPointModal';

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
    selectedSafetyPoint, setSelectedSafetyPoint,
    showLegend, setShowLegend,
    currentLocation,
    filteredIncidents,
    filteredSafetyPoints,
    handleLocate,
    handleSelectIncident,
    handleSelectSafetyPoint,
    handleRouteToIncident,
    handleAddSafetyPoint,
    handleDeleteSafetyPoint,
    showSafetyPointModal,
    setShowSafetyPointModal,
    isSubmitting,
    handleAcceptSos,
    activeTask,
    showCompleteModal,
    setShowCompleteModal,
    handleCompleteSuccess,
    routeData,
    isFollowing,
    setIsFollowing,
    isPanelOpen,
    setIsPanelOpen,
    safetyListLimit,
    incidentListLimit,
    handleLoadMoreIncidents,
    handleLoadMoreSafety
  } = useVolunteerMapViewModel();

  return (
    <div className={`rm-container ${!isPanelOpen ? 'panel-closed' : ''}`}>
      {/* BASE MAP */}
      <Map
        {...viewState}
        onMove={e => setViewState(e.viewState)}
        onDragStart={() => setIsFollowing(false)}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        mapStyle={MAP_STYLE}
      >
        <NavigationControl position="bottom-left" />

        {/* User location */}
        {currentLocation && (
          <Marker longitude={currentLocation.lng} latitude={currentLocation.lat} anchor="center">
            <div className="rm-user-dot">
              <div className="rm-user-pulse" />
            </div>
          </Marker>
        )}

        {/* Incident markers */}
        {filteredIncidents.filter(i => i.hasLocation).map(inc => (
          <Marker
            key={inc.id}
            longitude={inc.lng}
            latitude={inc.lat}
            anchor="center"
          >
            <div
              className={`rm-incident-marker ${inc.status === 'ACTIVE' ? 'marker-pulse' : ''} ${selectedIncident?.id === inc.id ? 'marker-pulse' : ''}`}
              style={{ background: INCIDENT_COLORS[inc.type as keyof typeof INCIDENT_COLORS] || '#EF4444' }}
              title={inc.title}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectIncident(inc);
              }}
            >
              {INCIDENT_ICONS[inc.type] || INCIDENT_ICONS['URGENT']}
            </div>
          </Marker>
        ))}

        {/* Safety point markers */}
        {filteredSafetyPoints
          .filter(point => point.latitude !== null && point.longitude !== null && point.latitude !== 0)
          .map(point => (
            <Marker
              key={point.id}
              longitude={point.longitude!}
              latitude={point.latitude!}
              anchor="bottom"
            >
              <div 
                className={`rm-safety-marker ${selectedSafetyPoint?.id === point.id ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectSafetyPoint(point);
                }}
              >
                📍
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

      {/* FLOATING ACTION BUTTONS */}
      <button className="btn-add-safety" onClick={() => setShowSafetyPointModal(true)}>
        <ShieldCheck size={24} />
      </button>

      {/* TOP SEARCH BAR */}
      <div className="rm-topbar">
        <div className="rm-search">
          <Search size={16} className="rm-search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm sự cố, điểm an toàn..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="rm-stats-chips">
          <span className="rm-chip safety">{filteredSafetyPoints.length} Điểm an toàn</span>
        </div>
      </div>

      {/* LOCATE BUTTON */}
      <button 
        className={`rm-locate-btn ${isFollowing ? 'following' : ''}`} 
        onClick={handleLocate}
        style={{ 
          backgroundColor: isFollowing ? '#F85A2B' : 'white', 
          color: isFollowing ? 'white' : '#F85A2B' 
        }}
      >
        <Crosshair size={18} />
      </button>

      {/* Panel (Incident List & Detail) */}
      <div className="rm-panel">
        <div className="rm-mobile-handle" onClick={() => setIsPanelOpen(!isPanelOpen)} />

        <button className="rm-panel-toggle" onClick={() => setIsPanelOpen(!isPanelOpen)}>
          {isPanelOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <div className="rm-panel-header">
          <h3>Dữ liệu thời gian thực</h3>
          <span className="rm-panel-count">{filteredIncidents.length + filteredSafetyPoints.length}</span>
        </div>

        <div className="rm-incident-list">
          {filteredIncidents.length === 0 && filteredSafetyPoints.length === 0 && (
            <div className="rm-no-results">
              <div className="rm-no-results-icon">🔍</div>
              <p>Không tìm thấy dữ liệu phù hợp</p>
            </div>
          )}

          {filteredIncidents.length > 0 && (
            <div className="rm-list-section-title">Nhu cầu cứu trợ</div>
          )}
          {filteredIncidents.slice(0, incidentListLimit).map(inc => {
            const statusCfg = STATUS_CONFIG[inc.status as keyof typeof STATUS_CONFIG] || { label: inc.status, cls: 'inc-active' };
            return (
              <div
                key={inc.id}
                className={`rm-incident-item ${selectedIncident?.id === inc.id ? 'selected' : ''}`}
                onClick={() => handleSelectIncident(inc)}
              >
                <div
                  className="rm-inc-color-bar"
                  style={{ background: INCIDENT_COLORS[inc.type as keyof typeof INCIDENT_COLORS] || '#EF4444' }}
                />
                <div className="rm-inc-content">
                  <div className="rm-inc-top">
                    <h4>{inc.title}</h4>
                    <span className={`rm-inc-status ${statusCfg.cls}`}>{statusCfg.label}</span>
                  </div>
                  <div className="rm-inc-meta">
                    <span>📍 {inc.location}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredIncidents.length > incidentListLimit && (
            <button className="btn-load-more" onClick={handleLoadMoreIncidents}>
              Xem thêm sự cố (+{filteredIncidents.length - incidentListLimit})
            </button>
          )}

          {filteredSafetyPoints.length > 0 && (
            <div className="rm-list-section-title">Điểm an toàn & Trú ẩn</div>
          )}

          {filteredSafetyPoints.slice(0, safetyListLimit).map(point => (
            <div 
              key={point.id} 
              className={`rm-safety-card ${selectedSafetyPoint?.id === point.id ? 'active' : ''}`}
              onClick={() => handleSelectSafetyPoint(point)}
            >
              <div className="rm-inc-color-bar safety" />
              <div className="rm-inc-content">
                <div className="rm-inc-top">
                  <h4>📍 {point.name}</h4>
                  <span className={`rm-inc-status safety-${point.type?.toLowerCase() || 'other'}`}>
                    {point.type}
                  </span>
                </div>
                <div className="rm-inc-meta">
                  <span>🏠 {point.address}</span>
                </div>
              </div>
            </div>
          ))}

          {filteredSafetyPoints.length > safetyListLimit && (
            <button className="btn-load-more" onClick={handleLoadMoreSafety}>
              Xem thêm điểm an toàn (+{filteredSafetyPoints.length - safetyListLimit})
            </button>
          )}
        </div>

        {/* SELECTED INCIDENT DETAIL - Fixed at bottom of panel */}
        {selectedIncident && (
          <div className="rm-incident-detail">
            <div className="rm-detail-header">
              <div
                className="rm-detail-type-dot"
                style={{ background: INCIDENT_COLORS[selectedIncident.type as keyof typeof INCIDENT_COLORS] }}
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

        {/* SELECTED SAFETY POINT DETAIL - Fixed at bottom of panel */}
        {selectedSafetyPoint && (
          <div className="rm-incident-detail safety-detail">
            <div className="rm-detail-header">
              <div className="rm-detail-type-dot" style={{ background: '#10B981' }} />
              <span className="rm-detail-type">ĐIỂM AN TOÀN</span>
              <button className="rm-detail-close" onClick={() => setSelectedSafetyPoint(null)}>
                <X size={16} />
              </button>
            </div>
            <h4 className="rm-detail-title">📍 {selectedSafetyPoint.name}</h4>
            <div className="rm-detail-info">
              <MapPin size={14} /> {selectedSafetyPoint.address}
            </div>
            <div className="rm-detail-desc" style={{ fontSize: '0.85rem', color: '#64748b', margin: '8px 0' }}>
              {selectedSafetyPoint.description}
            </div>
            <div className="rm-detail-actions">
              <button 
                className="btn-delete-point" 
                onClick={() => handleDeleteSafetyPoint(selectedSafetyPoint.id)}
                disabled={isSubmitting}
              >
                <Trash2 size={16} /> Xóa điểm này
              </button>
            </div>
          </div>
        )}
      </div>

      <SafetyPointModal
        isOpen={showSafetyPointModal}
        onClose={() => setShowSafetyPointModal(false)}
        onSubmit={handleAddSafetyPoint}
        userLocation={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : null}
        isSubmitting={isSubmitting}
      />

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


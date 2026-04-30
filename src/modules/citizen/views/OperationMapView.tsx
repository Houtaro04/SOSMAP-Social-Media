import React from 'react';
import { Map, Marker, NavigationControl, Popup } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useMapViewModel } from '../viewmodels/useMapViewModel';
import type { MapFilterType } from '@/shared/entities/MapEntity';
import { Search, ShieldAlert, Crosshair, X } from 'lucide-react';
import { SosFormModal } from './SosFormModal';

import '@/styles/OperationMapView.css';

// Tile miễn phí Maptiler (Có thể thay bằng link style Mapbox của bạn nếu có)
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const INCIDENT_COLORS: Record<string, string> = {
  URGENT: '#EF4444',
  MEDICAL: '#14B8A6',
  LOGISTICS: '#F59E0B',
  FLOOD: '#3B82F6',
};

export const OperationMapView: React.FC = () => {
  const {
    sosReports,
    safetyPoints,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    viewState,
    setViewState,
    isSosModalOpen,
    setIsSosModalOpen,
    userLiveLocation,
    selectedSosReport,
    setSelectedSosReport,
    selectedSafetyPoint,
    setSelectedSafetyPoint,
    isFollowing,
    setIsFollowing
  } = useMapViewModel();

  const handleFilterClick = (type: MapFilterType) => {
    setFilterType(type);
  };

  return (
    <div className="operation-map-container">
      {/* MapLibre / Mapbox Base */}
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onDragStart={() => setIsFollowing(false)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        dragRotate={true}
        pitchWithRotate={true}
      >
        <NavigationControl position="bottom-left" />

        {/* Marker vị trí hiện tại của user (Blue Pulsing Dot) */}
        {userLiveLocation && (
          <Marker
            longitude={userLiveLocation.lng}
            latitude={userLiveLocation.lat}
            anchor="center"
          >
            <div className="live-location-dot">
              <div className="pulse"></div>
            </div>
          </Marker>
        )}

        {/* Nút Target My Location nhỏ */}
        <button
          className={`btn-my-location ${isFollowing ? 'following' : ''}`}
          style={{ backgroundColor: isFollowing ? '#0ea5e9' : 'white', color: isFollowing ? 'white' : 'black' }}
          onClick={() => {
            if (userLiveLocation) {
              setIsFollowing(true);
              setViewState({ ...viewState, longitude: userLiveLocation.lng, latitude: userLiveLocation.lat, zoom: 15 });
            }
          }}
        >
          <Crosshair size={20} />
        </button>

        {/* Render Markers for SOS Reports */}
        {sosReports.map(report => (
          report.latitude && report.longitude ? (
            <Marker
              key={report.id}
              longitude={report.longitude}
              latitude={report.latitude}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedSafetyPoint(null); // Close safety point popup
                setSelectedSosReport(report);
              }}
            >
              <div
                className="marker-sos-pulse"
                style={{ backgroundColor: INCIDENT_COLORS[report.level as string] || '#EF4444' }}
              >
                <ShieldAlert size={16} color="white" />
              </div>
            </Marker>
          ) : null
        ))}

        {/* Render Markers for Safety Points */}
        {safetyPoints.map(point => (
          point.latitude && point.longitude ? (
            <Marker
              key={point.id}
              longitude={point.longitude}
              latitude={point.latitude}
              anchor="bottom"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedSosReport(null); // Close SOS popup
                setSelectedSafetyPoint(point);
              }}
            >
              <div className="marker-safety-point">
                <span>📍</span>
              </div>
            </Marker>
          ) : null
        ))}

        {/* SOS Report Popup */}
        {selectedSosReport && selectedSosReport.latitude && selectedSosReport.longitude && (
          <Popup
            longitude={selectedSosReport.longitude}
            latitude={selectedSosReport.latitude}
            anchor="bottom"
            onClose={() => setSelectedSosReport(null)}
            closeButton={false}
            closeOnClick={false}
            offset={25}
          >
            <div className="citizen-popup-card" style={{ padding: '8px', minWidth: '180px' }}>
              <div className="popup-h" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '8px' }}>
                <strong style={{ color: INCIDENT_COLORS[selectedSosReport.level as string] || '#EF4444' }}>
                  {selectedSosReport.level === 'URGENT' ? 'Cấp bách / Sơ tán' : 
                   selectedSosReport.level === 'MEDICAL' ? 'Y tế khẩn cấp' : 
                   selectedSosReport.level === 'LOGISTICS' ? 'Hậu cần' : 
                   selectedSosReport.level === 'FLOOD' ? 'Ngập lụt' : 'Cầu cứu'}
                </strong>
                <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSelectedSosReport(null)} />
              </div>
              <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Người yêu cầu:</strong> {(selectedSosReport as any).fullName || 'Ẩn danh'}</p>
              <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Chi tiết:</strong> {selectedSosReport.details}</p>
              <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>{selectedSosReport.address}</p>
            </div>
          </Popup>
        )}

        {/* Safety Point Popup */}
        {selectedSafetyPoint && selectedSafetyPoint.latitude && selectedSafetyPoint.longitude && (
          <Popup
            longitude={selectedSafetyPoint.longitude}
            latitude={selectedSafetyPoint.latitude}
            anchor="bottom"
            onClose={() => setSelectedSafetyPoint(null)}
            closeButton={false}
            closeOnClick={false}
            offset={15}
          >
            <div className="citizen-popup-card safety-point-popup" style={{ padding: '8px', minWidth: '180px' }}>
              <div className="popup-h" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #10B981', paddingBottom: '4px', marginBottom: '8px' }}>
                <strong style={{ color: '#10B981' }}>📍 {selectedSafetyPoint.name}</strong>
                <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSelectedSafetyPoint(null)} />
              </div>
              <div className="popup-body">
                <span className="point-type-badge" style={{ backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', display: 'inline-block' }}>
                  {selectedSafetyPoint.type?.toUpperCase()}
                </span>
                <p style={{ margin: '4px 0', fontSize: '13px' }}>{selectedSafetyPoint.description}</p>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}><strong>Địa chỉ:</strong> {selectedSafetyPoint.address}</p>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* OVERLAY UI */}

      {/* 1. Header Area: Floating Search */}
      <div className="map-overlay-header">
        <div className="map-header-actions" style={{ marginLeft: 'auto' }}>
          <div className="map-search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm vị trí..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="map-overlay-bottom-actions">
        <button className="btn-rescue-request" onClick={() => setIsSosModalOpen(true)}>
          + Gửi yêu cầu cứu trợ
        </button>
      </div>

      {/* 3. Filter Toggle Buttons */}
      <div className="map-overlay-filters">
        <button
          className={`filter-btn ${filterType === 'ALL' ? 'active' : ''}`}
          onClick={() => handleFilterClick('ALL')}
        >
          Tất cả
        </button>
        <button
          className={`filter-btn alert-status ${filterType === 'URGENT' ? 'active' : ''}`}
          onClick={() => handleFilterClick('URGENT')}
        >
          🚨 Cấp bách
        </button>
        <button
          className={`filter-btn medical-status ${filterType === 'MEDICAL' ? 'active' : ''}`}
          onClick={() => handleFilterClick('MEDICAL')}
        >
          🏥 Y tế
        </button>
        <button
          className={`filter-btn food-status ${filterType === 'LOGISTICS' ? 'active' : ''}`}
          onClick={() => handleFilterClick('LOGISTICS')}
        >
          🍞 Thực phẩm
        </button>
        <button
          className={`filter-btn shelter-status ${filterType === 'FLOOD' ? 'active' : ''}`}
          onClick={() => handleFilterClick('FLOOD')}
        >
          🌊 Ngập lụt
        </button>
        <button
          className={`filter-btn safety-status ${filterType === 'SAFETY' ? 'active' : ''}`}
          onClick={() => handleFilterClick('SAFETY')}
        >
          📍 Điểm an toàn
        </button>
      </div>

      <SosFormModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
        userLiveLocation={userLiveLocation}
      />
    </div>
  );
};

export default OperationMapView;

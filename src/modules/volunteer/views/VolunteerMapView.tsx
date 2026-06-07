import React from 'react';
import { Map, Marker, NavigationControl, Source, Layer } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Search, Crosshair, AlertTriangle, HeartPulse,
  Truck, MapPin, Clock, ChevronRight, Layers, X,
  ShieldCheck, Trash2, ChevronLeft, List, Edit
} from 'lucide-react';
import '@/styles/VolunteerMapView.css';
import '@/styles/SafetyPointModal.css';
import { useVolunteerMapViewModel } from '../viewmodels/useVolunteerMapViewModel';
import { CompleteTaskModal } from '../components/CompleteTaskModal';
import { SafetyPointModal } from '../components/SafetyPointModal';
import { CancelTaskModal } from '../components/CancelTaskModal';
import useSupercluster from 'use-supercluster';
import type { MapRef } from '@vis.gl/react-maplibre';

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

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
  APPROVED: { label: 'Chờ tiếp nhận', cls: 'inc-active' },
  RESPONDING: { label: 'Đã có người nhận', cls: 'inc-responding' },
  RESOLVED: { label: 'Đã giải quyết', cls: 'inc-resolved' },
  MY_TASK: { label: 'Đơn hiện tại', cls: 'inc-responding' },
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
    selectedRoutingDistance,
    handleLocate,
    handleSelectIncident,
    handleSelectSafetyPoint,
    handleRouteToIncident,
    handleAddSafetyPoint,
    handleUpdateSafetyPoint,
    handleDeleteSafetyPoint,
    showSafetyPointModal,
    setShowSafetyPointModal,
    editingSafetyPoint,
    handleOpenEditSafetyPoint,
    handleCloseSafetyPointModal,
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
    handleLoadMoreSafety,
    mockDataUrl,
    isGenerating,
    mockTotalCount,
    generateMockData
  } = useVolunteerMapViewModel();

  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const mapRef = React.useRef<MapRef>(null);
  const [bounds, setBounds] = React.useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = React.useState<number>(12);

  const updateBounds = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      const b = map.getBounds();
      if (b) {
        setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
        setZoom(map.getZoom());
      }
    }
  };

  const handleMapLoad = (e: any) => {
    updateBounds();
    const map = e.target;
    
    const icons = {
      'icon-urgent': { color: '#EF4444', path: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z M12 9v4 M12 17h.01' },
      'icon-medical': { color: '#14B8A6', path: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z M12 7v6 M9 10h6' },
      'icon-logistics': { color: '#F59E0B', path: 'M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11 M14 9h4l4 4v5c0 .6-.4 1-1 1h-2 M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M17 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z' },
      'icon-flood': { color: '#3B82F6', path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M22 12h-4 M6 12H2 M12 6V2 M12 22v-4' },
      'icon-safety': { color: '#10B981', path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z M12 11.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z' },
    };

    Object.entries(icons).forEach(([id, data]) => {
      const svgString = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="${data.color}"/><g transform="translate(4, 4) scale(1)"><path d="${data.path}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
      const img = new Image();
      img.onload = () => {
        if (!map.hasImage(id)) {
          map.addImage(id, img);
        }
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    });
  };

  const points = React.useMemo(() => {
    const activeRouteId = routeData ? (selectedIncident?.id || selectedSafetyPoint?.id) : null;
    
    return [
      ...filteredIncidents
        .filter(i => i.hasLocation && !(i as any).isMockListOnly && (!activeRouteId || i.id === activeRouteId))
        .map(inc => ({
          type: 'Feature' as const,
          properties: { cluster: false as const, id: inc.id, category: 'incident', data: inc },
          geometry: { type: 'Point' as const, coordinates: [inc.lng, inc.lat] }
        })),
      ...filteredSafetyPoints
        .filter(p => p.latitude !== null && p.longitude !== null && p.latitude !== 0 && !(p as any).isMockListOnly && (!activeRouteId || p.id === activeRouteId))
        .map(point => ({
          type: 'Feature' as const,
          properties: { cluster: false as const, id: point.id, category: 'safetyPoint', data: point as any },
          geometry: { type: 'Point' as const, coordinates: [point.longitude!, point.latitude!] }
        }))
    ];
  }, [filteredIncidents, filteredSafetyPoints, routeData, selectedIncident, selectedSafetyPoint]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: bounds ? bounds : undefined,
    zoom,
    options: { radius: 75, maxZoom: 20 }
  });

  return (
    <div className={`rm-container ${!isPanelOpen ? 'panel-closed' : ''}`}>
      <Map
        {...viewState}
        ref={mapRef}
        onMove={e => {
          setViewState(e.viewState);
          updateBounds();
        }}
        onLoad={handleMapLoad}
        onDragStart={() => setIsFollowing(false)}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        mapStyle={MAP_STYLE}
        interactiveLayerIds={['mock-unclustered-point', 'mock-clusters']}
        onClick={(e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          if (feature.layer.id === 'mock-clusters') {
             const clusterId = feature.properties?.cluster_id;
             const source = mapRef.current?.getMap().getSource('mock-data-source') as any;
             if (source && source.getClusterExpansionZoom) {
               source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                 if (err) return;
                 mapRef.current?.flyTo({
                   center: (feature.geometry as any).coordinates,
                   zoom: zoom,
                   duration: 500
                 });
               });
             }
          } else if (feature.layer.id === 'mock-unclustered-point') {
             const data = feature.properties as any;
             if (data.category === 'incident') {
                handleSelectIncident({
                  id: data.id,
                  title: data.title,
                  type: data.type,
                  status: 'ACTIVE',
                  location: 'Mock Location',
                  fullName: 'Mock User',
                  phoneNumber: '0123456789',
                  hasLocation: true,
                  lat: (feature.geometry as any).coordinates[1],
                  lng: (feature.geometry as any).coordinates[0],
                  distance: 0,
                  timeAgo: 'vừa xong'
                } as any);
             } else {
                handleSelectSafetyPoint({
                  id: data.id,
                  name: data.title,
                  type: data.type,
                  address: 'Mock Address',
                  description: 'Mock Description',
                  latitude: (feature.geometry as any).coordinates[1],
                  longitude: (feature.geometry as any).coordinates[0]
                } as any);
             }
          }
        }}
        onMouseEnter={(e) => {
          if (e.features && e.features.length > 0) {
            e.target.getCanvas().style.cursor = 'pointer';
          }
        }}
        onMouseLeave={(e) => {
          e.target.getCanvas().style.cursor = '';
        }}
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

        {/* Clusters and Markers */}
        {clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const clusterProps = cluster.properties as any;
          const isCluster = clusterProps.cluster;
          const pointCount = clusterProps.point_count || 0;

          if (isCluster) {
            return (
              <Marker key={`cluster-${cluster.id}`} latitude={latitude} longitude={longitude} anchor="center">
                <div 
                  className="rm-cluster-marker"
                  style={{
                    width: `${Math.min(20 + (pointCount / points.length) * 40, 50)}px`,
                    height: `${Math.min(20 + (pointCount / points.length) * 40, 50)}px`,
                    background: 'rgba(168, 85, 247, 0.9)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
                    cursor: 'pointer',
                    border: '2px solid white'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const expansionZoom = Math.min(supercluster?.getClusterExpansionZoom(cluster.id as number) || 20, 20);
                    mapRef.current?.flyTo({ center: [longitude, latitude], zoom: expansionZoom, duration: 500 });
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }

          if (clusterProps.category === 'incident') {
            const inc = clusterProps.data as any;
            return (
              <Marker key={inc.id} longitude={inc.lng} latitude={inc.lat} anchor="center">
                <div
                  className={`rm-incident-marker ${inc.status === 'ACTIVE' ? 'marker-pulse' : ''} ${selectedIncident?.id === inc.id ? 'marker-pulse' : ''} ${inc.isMyTask ? 'is-my-task' : ''}`}
                  style={{ background: inc.isMyTask ? '#A855F7' : (INCIDENT_COLORS[inc.type as keyof typeof INCIDENT_COLORS] || '#EF4444') }}
                  title={inc.isMyTask ? `NHIỆM VỤ CỦA BẠN: ${inc.title}` : inc.title}
                  onClick={(e) => { e.stopPropagation(); handleSelectIncident(inc); }}
                >
                  {INCIDENT_ICONS[inc.type] || INCIDENT_ICONS['URGENT']}
                </div>
              </Marker>
            );
          }

          if (clusterProps.category === 'safetyPoint') {
            const point = clusterProps.data as any;
            return (
              <Marker key={point.id} longitude={point.longitude!} latitude={point.latitude!} anchor="bottom">
                <div 
                  className={`rm-safety-marker ${selectedSafetyPoint?.id === point.id ? 'selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleSelectSafetyPoint(point); }}
                  style={{ fontSize: '24px', cursor: 'pointer', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}
                >
                  📍
                </div>
              </Marker>
            );
          }

          return null;
        })}

        {mockDataUrl && (() => {
          const activeRouteId = routeData ? (selectedIncident?.id || selectedSafetyPoint?.id) : null;
          return (
          <Source
            id="mock-data-source"
            type="geojson"
            data={mockDataUrl}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            <Layer
              id="mock-clusters"
              type="circle"
              filter={activeRouteId ? ['==', 'id', 'HIDE_ALL'] : ['has', 'point_count']}
              paint={{
                'circle-color': '#A855F7',
                'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
                'circle-opacity': 0.9,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff',
              }}
            />
            <Layer
              id="mock-cluster-count"
              type="symbol"
              filter={activeRouteId ? ['==', 'id', 'HIDE_ALL'] : ['has', 'point_count']}
              layout={{
                'text-field': '{point_count_abbreviated}',
                'text-size': 12,
              }}
              paint={{
                'text-color': '#ffffff'
              }}
            />
            <Layer
              id="mock-unclustered-point"
              type="symbol"
              filter={activeRouteId ? ['==', 'id', activeRouteId] : ['!', ['has', 'point_count']]}
              layout={{
                'icon-image': [
                  'match',
                  ['get', 'category'],
                  'incident', [
                    'match',
                    ['get', 'type'],
                    'URGENT', 'icon-urgent',
                    'MEDICAL', 'icon-medical',
                    'LOGISTICS', 'icon-logistics',
                    'FLOOD', 'icon-flood',
                    'icon-urgent'
                  ],
                  'safetyPoint', 'icon-safety',
                  'icon-safety'
                ],
                'icon-size': 1,
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
              }}
            />
          </Source>
          );
        })()}

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
          {/* Tạm thời comment lại sinh 1K data */}
          {/* <button onClick={generateMockData} disabled={isGenerating} className="rm-chip" style={{ background: '#A855F7', color: 'white', border: 'none', cursor: isGenerating ? 'wait' : 'pointer', padding: '0 12px' }}>
            {isGenerating ? 'Đang gen...' : '⚡ Gen 1K Data'}
          </button> */}
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

        {activeTask && (
          <div className="rm-active-task-banner-inline" onClick={() => {
            const inc = filteredIncidents.find(i => i.id === activeTask.reportId);
            if (inc) handleSelectIncident(inc);
          }}>
            <div className="banner-pulse" />
            <div className="banner-info">
              <p className="banner-label">NHIỆM VỤ HIỆN TẠI</p>
              <p className="banner-id">#{activeTask.id.substring(0, 8)}</p>
            </div>
          </div>
        )}

        <div className="rm-panel-header">
          <h3>Dữ liệu thời gian thực</h3>
          <span className="rm-panel-count">
            {mockTotalCount > 0 ? '1,000,000+' : filteredIncidents.length + filteredSafetyPoints.length}
          </span>
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
            let configKey = inc.status as keyof typeof STATUS_CONFIG;
            if (inc.isMyTask) {
              configKey = 'MY_TASK';
            }
            const statusCfg = STATUS_CONFIG[configKey] || { label: inc.status, cls: 'inc-active' };
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
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                      {inc.distance && <span style={{ color: '#0ea5e9', fontWeight: 'bold' }}>📍 {inc.distance}</span>}
                      <span style={{ color: '#6b7280' }}>🕒 {inc.timeAgo}</span>
                    </div>
                    <span>👤 {inc.fullName || 'Ẩn danh'}</span>
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
              className={`rm-incident-item safety-item ${selectedSafetyPoint?.id === point.id ? 'selected' : ''}`}
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
                  {(point as any).distanceStr && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                      <span style={{ color: '#10B981', fontWeight: 'bold' }}>📍 Cách bạn: {(point as any).distanceStr}</span>
                    </div>
                  )}
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
            <div className="rm-detail-info" style={{ marginBottom: '6px', display: 'flex', gap: '12px' }}>
              <span>👤 Người yêu cầu: {selectedIncident.fullName || 'Ẩn danh'}</span>
            </div>
            {selectedRoutingDistance && (
              <div className="rm-detail-info" style={{ marginBottom: '6px', color: '#0ea5e9', fontWeight: 'bold' }}>
                📍 Cách bạn: {selectedRoutingDistance}
              </div>
            )}
            {selectedIncident.phoneNumber && (
              <div className="rm-detail-info" style={{ marginBottom: '6px' }}>
                📞 SDT: {selectedIncident.phoneNumber}
              </div>
            )}
            <div className="rm-detail-info">
              <MapPin size={14} /> {selectedIncident.location}
              {selectedIncident.hasLocation && (
                <button 
                  className="btn-open-gmap" 
                  onClick={() => {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedIncident.lat},${selectedIncident.lng}`, '_blank');
                  }}
                  disabled={!selectedIncident.isMyTask}
                  title={!selectedIncident.isMyTask ? 'Bạn chưa tiếp nhận đơn này' : 'Mở Google Maps'}
                  style={{ 
                    marginTop: '8px', 
                    padding: '6px 12px', 
                    fontSize: '0.8rem', 
                    borderRadius: '6px', 
                    border: '1px solid #3B82F6', 
                    background: !selectedIncident.isMyTask ? 'transparent' : '#3B82F6', 
                    color: !selectedIncident.isMyTask ? '#9CA3AF' : 'white', 
                    cursor: !selectedIncident.isMyTask ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    width: 'fit-content',
                    borderColor: !selectedIncident.isMyTask ? '#D1D5DB' : '#3B82F6'
                  }}
                >
                  <MapPin size={14} /> Google maps
                </button>
              )}
            </div>
            {!selectedIncident.hasLocation && (
              <div className="rm-location-warning" style={{ color: '#F87171', fontSize: '0.8rem', marginTop: '4px', fontWeight: '500' }}>
                ⚠️ Yêu cầu này chỉ có địa chỉ, chưa có vị trí bản đồ.
              </div>
            )}
            <div className="rm-detail-actions">
              <button 
                className="rm-btn-route" 
                onClick={handleRouteToIncident}
                disabled={!selectedIncident.isMyTask}
                title={!selectedIncident.isMyTask ? 'Bạn chưa tiếp nhận đơn này' : ''}
                style={{ opacity: !selectedIncident.isMyTask ? 0.5 : 1, cursor: !selectedIncident.isMyTask ? 'not-allowed' : 'pointer' }}
              >
                📍 Dẫn đường
              </button>

              {activeTask?.reportId === selectedIncident.id ? (
                <>
                  <button
                    className="rm-btn-complete"
                    onClick={() => setShowCompleteModal(true)}
                  >
                    ✓ Hoàn thành
                  </button>
                  <button
                    className="rm-btn-complete"
                    onClick={() => setShowCancelModal(true)}
                    style={{ background: '#FEE2E2', color: '#EF4444' }}
                  >
                    Hủy nhiệm vụ
                  </button>
                </>
              ) : selectedIncident.status === 'RESPONDING' ? (
                <button
                  className="rm-btn-accept disabled"
                  disabled={true}
                  style={{ cursor: 'not-allowed', background: '#E5E7EB', color: '#6B7280' }}
                >
                  Đã có người nhận
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
            {selectedRoutingDistance && (
              <div className="rm-detail-info" style={{ marginBottom: '6px', color: '#10B981', fontWeight: 'bold' }}>
                📍 Cách bạn: {selectedRoutingDistance}
              </div>
            )}
            <div className="rm-detail-info">
              <MapPin size={14} /> {selectedSafetyPoint.address}
            </div>
            <div className="rm-detail-desc" style={{ fontSize: '0.85rem', color: '#64748b', margin: '8px 0' }}>
              {selectedSafetyPoint.description}
            </div>
            <div className="rm-detail-actions">
              <button 
                className="btn-edit-point" 
                onClick={() => handleOpenEditSafetyPoint(selectedSafetyPoint)}
                disabled={isSubmitting}
                style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}
              >
                <Edit size={16} /> Sửa
              </button>
              <button 
                className="btn-delete-point" 
                onClick={() => handleDeleteSafetyPoint(selectedSafetyPoint.id)}
                disabled={isSubmitting}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <Trash2 size={16} /> Xóa
              </button>
            </div>
          </div>
        )}
      </div>

      <SafetyPointModal
        isOpen={showSafetyPointModal}
        onClose={handleCloseSafetyPointModal}
        onSubmit={(point) => editingSafetyPoint ? handleUpdateSafetyPoint(editingSafetyPoint.id, point) : handleAddSafetyPoint(point)}
        userLocation={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : null}
        isSubmitting={isSubmitting}
        initialData={editingSafetyPoint || undefined}
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

      {activeTask && (
        <CancelTaskModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          taskId={activeTask.id}
          onSuccess={() => {
            handleCompleteSuccess();
            setShowCancelModal(false);
          }}
        />
      )}
    </div>
  );
};

export default VolunteerMapView;


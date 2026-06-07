import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useGeolocation } from '../../../core/utils/useGeolocation';
import { showConfirm } from '@/lib/confirm';

// Default view state for the map
const DEFAULT_VIEW_STATE = {
  latitude: 21.0285,
  longitude: 105.8542,
  zoom: 12,
};

export interface Incident {
  id: string;
  type: 'URGENT' | 'MEDICAL' | 'LOGISTICS' | 'FLOOD';
  title: string;
  location: string;
  timeAgo: string;
  distance: string;
  lat: number;
  lng: number;
  status: 'ACTIVE' | 'APPROVED' | 'RESPONDING' | 'RESOLVED';
  hasLocation: boolean;
  isMyTask?: boolean;
  fullName?: string;
  phoneNumber?: string;
}

import { sosService } from '@/shared/services/sosService';
import { rescueTaskService } from '@/shared/services/rescueTaskService';
import { mapService } from '@/shared/services/mapService';
import { useAuthStore } from '@/store/authStore';
import { useSearchParams } from 'react-router-dom';
import { RescueTaskEntity } from '@/shared/entities/RescueTaskEntity';
import { SafetyPointResponse, SosReportResponse } from '@/shared/entities/MapEntity';



export function useVolunteerMapViewModel() {
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
  const [searchQuery, setSearchQuery] = useState('');
  const [safetyListLimit, setSafetyListLimit] = useState(5);
  const [incidentListLimit, setIncidentListLimit] = useState(5);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedSafetyPoint, setSelectedSafetyPoint] = useState<SafetyPointResponse | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  const { location: userLocation, isLocating } = useGeolocation();

  const [rawIncidents, setRawIncidents] = useState<any[]>([]);
  const [safetyPoints, setSafetyPoints] = useState<SafetyPointResponse[]>([]);
  const [hasCentered, setHasCentered] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false); // Mode theo dõi liên tục

  // Lưu trữ các tọa độ đã được Geocode cục bộ để không bị mất khi fetch lại dữ liệu từ server
  const [geocodedLocations, setGeocodedLocations] = useState<Record<string, { lat: number, lng: number }>>({});
  const [routeData, setRouteData] = useState<any>(null);
  const [selectedRoutingDistance, setSelectedRoutingDistance] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<RescueTaskEntity | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showSafetyPointModal, setShowSafetyPointModal] = useState(false);
  const [editingSafetyPoint, setEditingSafetyPoint] = useState<SafetyPointResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [mockDataUrl, setMockDataUrl] = useState<string | null>(null);
  const [mockTotalCount, setMockTotalCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchParams] = useSearchParams();

  const { user } = useAuthStore();

  const fetchRoute = async (endLat: number, endLng: number) => {
    if (!userLocation) return;
    setSelectedRoutingDistance('Đang tính...');
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${endLng},${endLat}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        setRouteData({
          type: 'Feature',
          properties: {},
          geometry: data.routes[0].geometry
        });
        const distanceKm = data.routes[0].distance / 1000;
        setSelectedRoutingDistance(distanceKm < 1 ? '<1km' : distanceKm.toFixed(1) + 'km');
      } else {
        setRouteData(null);
        setSelectedRoutingDistance(null);
      }
    } catch (e) {
      console.error('OSRM Routing Error', e);
      setRouteData(null);
      setSelectedRoutingDistance(null);
    }
  };

  // Tính khoảng cách ngay khi bấm chọn chi tiết (không cần đợi bấm Dẫn đường)
  useEffect(() => {
    let active = true;
    const calculateDistanceForSelected = async () => {
      if (!userLocation) return;
      
      const target = selectedIncident || selectedSafetyPoint;
      if (!target) {
        // Chỉ reset nếu không có target nào được chọn
        if (!routeData) setSelectedRoutingDistance(null);
        return;
      }
      
      let lat: number, lng: number;
      if ('hasLocation' in target) { // Incident
        lat = target.lat;
        lng = target.lng;
        // Nếu sự cố không có tọa độ, không tính được
        if (!target.hasLocation) {
           setSelectedRoutingDistance(null);
           return;
        }
      } else { // Safety Point
        lat = typeof target.latitude === 'number' ? target.latitude : parseFloat(target.latitude as any);
        lng = typeof target.longitude === 'number' ? target.longitude : parseFloat(target.longitude as any);
      }

      if (isNaN(lat) || isNaN(lng)) {
        setSelectedRoutingDistance(null);
        return;
      }
      
      setSelectedRoutingDistance('Đang tính...');
      
      try {
        const { routingService } = await import('@/shared/services/routingService');
        const distanceKm = await routingService.getShortestPathDistance(userLocation.lng, userLocation.lat, lng, lat);
        
        if (active) {
          if (distanceKm !== null) {
            setSelectedRoutingDistance(distanceKm < 1 ? '<1km' : distanceKm.toFixed(1) + 'km');
          } else {
            setSelectedRoutingDistance(null);
          }
        }
      } catch (e) {
        if (active) setSelectedRoutingDistance(null);
      }
    };
    
    // Nếu có routeData (đang dẫn đường) thì fetchRoute đã tính khoảng cách rồi, không cần tính lại
    if (!routeData) {
      calculateDistanceForSelected();
    }
    return () => { active = false; };
  }, [selectedIncident, selectedSafetyPoint, userLocation, routeData]);

  useEffect(() => {
    fetchMapData();
    if (user?.id) {
      fetchActiveTask(user.id);
    }
  }, [user?.id]); // ONLY refetch when user changes (on mount/logout)

  const fetchActiveTask = async (uid: string) => {
    const { data } = await rescueTaskService.getMyActiveTask(uid);
    setActiveTask(data);
  };

  const fetchMapData = async () => {
    try {
      const [sosResp, safetyResp] = await Promise.all([
        sosService.getSosReports({ Limit: 100 }),
        mapService.getSafetyPoints()
      ]);
      setRawIncidents((sosResp.data || []).map((r: any) => new SosReportResponse(r)));
      setSafetyPoints((safetyResp.data || []).map((p: any) => new SafetyPointResponse(p)));
    } catch (e) {
      console.error('[VolunteerMap] fetch map data error:', e);
    }
  };

  const handleAddSafetyPoint = async (point: Partial<SafetyPointResponse>) => {
    setIsSubmitting(true);
    try {
      const res = await mapService.createSafetyPoint(point);
      if (res) {
        await fetchMapData();
        setShowSafetyPointModal(false);
        toast.success('Đã thêm điểm an toàn');
        return true;
      }
    } catch (e) {
      toast.error('Lỗi khi thêm điểm an toàn');
      console.error('[VolunteerMap] add safety point error:', e);
    } finally {
      setIsSubmitting(false);
    }
    return false;
  };

  const handleUpdateSafetyPoint = async (id: string, point: Partial<SafetyPointResponse>) => {
    setIsSubmitting(true);
    try {
      const res = await mapService.updateSafetyPoint(id, point);
      if (res) {
        await fetchMapData();
        setShowSafetyPointModal(false);
        if (selectedSafetyPoint?.id === id) {
          setSelectedSafetyPoint(prev => prev ? ({ ...prev, ...point } as SafetyPointResponse) : null);
        }
        toast.success('Đã cập nhật điểm an toàn');
        return true;
      }
    } catch (e) {
      toast.error('Lỗi khi cập nhật điểm an toàn');
      console.error('[VolunteerMap] update safety point error:', e);
    } finally {
      setIsSubmitting(false);
    }
    return false;
  };

  const handleDeleteSafetyPoint = async (id: string) => {
    if (!(await showConfirm('Bạn có chắc muốn xóa điểm an toàn này?'))) return;
    setIsSubmitting(true);
    try {
      const res = await mapService.deleteSafetyPoint(id);
      if (res.success) {
        await fetchMapData();
        setSelectedSafetyPoint(null);
        return true;
      }
    } catch (e) {
      console.error('[VolunteerMap] delete safety point error:', e);
    } finally {
      setIsSubmitting(false);
    }
    return false;
  };

  const handleOpenEditSafetyPoint = (point: SafetyPointResponse) => {
    setEditingSafetyPoint(point);
    setShowSafetyPointModal(true);
  };

  const handleCloseSafetyPointModal = () => {
    setShowSafetyPointModal(false);
    setEditingSafetyPoint(null);
  };

  // Mapped incidents with distance and timeAgo calculation
  const incidents = useMemo<Incident[]>(() => {
    return rawIncidents
      .filter(r => ['APPROVED', 'PROCESSING'].includes(r.status?.toUpperCase() || ''))
      .map(r => {
        let lat = typeof r.latitude === 'number' ? r.latitude : parseFloat(r.latitude as any);
        let lng = typeof r.longitude === 'number' ? r.longitude : parseFloat(r.longitude as any);
        
        if (geocodedLocations[r.id]) {
           lat = geocodedLocations[r.id].lat;
           lng = geocodedLocations[r.id].lng;
        }

        const hasLocation = !isNaN(lat) && !isNaN(lng);

        let distanceStr = ''; // Do NOT show distance on UI for the list

        let timeAbsStr = r.createdAt;
        try {
          const date = new Date(r.createdAt);
          const diffMin = Math.floor((new Date().getTime() - date.getTime()) / 60000);
          timeAbsStr = diffMin < 60 ? `${diffMin}p` : `${Math.floor(diffMin / 60)}h`;
        } catch (e) { }

        const levelUpper = (r.level || '').toUpperCase();
        return {
          id: r.id,
          type: (['URGENT', 'MEDICAL', 'LOGISTICS', 'FLOOD'].includes(levelUpper)) ? (levelUpper as any) : 'URGENT',
          title: r.details?.substring(0, 50) || 'Yêu cầu cứu trợ',
          location: r.address || '',
          timeAgo: timeAbsStr,
          distance: distanceStr,
          lat,
          lng,
          status: (['PROCESSING'].includes(r.status?.toUpperCase() || '')) ? 'RESPONDING' : 
                  (r.status?.toUpperCase() === 'APPROVED' ? 'APPROVED' : 'ACTIVE'),
          hasLocation,
          isMyTask: activeTask?.reportId === r.id,
          fullName: r.fullName,
          phoneNumber: r.phoneNumber
        } as Incident;
      });
  }, [rawIncidents, userLocation, activeTask, geocodedLocations]); // Recalculate when dependencies change

  // Auto select incident from URL
  useEffect(() => {
    const reportId = searchParams.get('reportId');
    if (reportId && incidents.length > 0) {
      const targetInc = incidents.find(i => i.id === reportId);
      if (targetInc && selectedIncident?.id !== targetInc.id) {
        handleSelectIncident(targetInc);
      }
    }
  }, [searchParams, incidents]);

  // Tự động căn giữa map khi lần đầu lấy được vị trí
  useEffect(() => {
    if (!userLocation) return;

    if (!hasCentered) {
      const isAccurate = userLocation.accuracy && userLocation.accuracy < 200;
      if (isAccurate) {
        setViewState(prev => ({
          ...prev,
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          zoom: 14
        }));
        setHasCentered(true);
        setIsFollowing(true);
      } else {
        const timeout = setTimeout(() => {
          setViewState(prev => ({
            ...prev,
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            zoom: 13
          }));
          setHasCentered(true);
        }, 3000);
        return () => clearTimeout(timeout);
      }
    } else if (isFollowing) {
      setViewState(prev => ({
        ...prev,
        latitude: userLocation.lat,
        longitude: userLocation.lng
      }));
    }
  }, [userLocation, hasCentered, isFollowing]);

  const normalizeText = (text: string) => {
    return (text || '')
      .normalize('NFC')
      .toLowerCase()
      .trim()
      .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
      .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
      .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
      .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
      .replace(/ù|ú|ụ|ủ|ĩ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
      .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
      .replace(/đ/g, 'd');
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      if (!searchQuery) return true;
      const q = normalizeText(searchQuery);
      return normalizeText(i.title).includes(q) || normalizeText(i.location).includes(q);
    });
  }, [incidents, searchQuery]);

  const filteredSafetyPoints = useMemo(() => {
    return safetyPoints.filter(p => {
      if (!searchQuery) return true;
      const q = normalizeText(searchQuery);
      return normalizeText(p.name || '').includes(q) || normalizeText(p.address || '').includes(q);
    }).map(p => {
      return { ...p, distanceStr: '' };
    });
  }, [safetyPoints, searchQuery]);

  // Debug log to trace data fetching
  useEffect(() => {
    if (safetyPoints.length > 0) {
      console.log('[VolunteerMap] Fetched safety points:', safetyPoints.map(p => p.name));
    }
  }, [safetyPoints]);

  const handleLocate = () => {
    if (userLocation) {
      setIsFollowing(true);
      setViewState(prev => ({
        ...prev,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        zoom: 14
      }));
    }
  };

  const handleSelectIncident = (inc: Incident) => {
    setSelectedSafetyPoint(null); // Clear safety point selection
    setSelectedIncident(inc);
    
    if (inc.hasLocation) {
      setViewState(prev => ({
        ...prev,
        latitude: inc.lat,
        longitude: inc.lng,
        zoom: 15
      }));
    } else {
      console.warn('[VolunteerMap] Incident has no valid coordinates:', inc.id);
    }
    setRouteData(null); // Xóa đường cũ khi chọn sự cố mới
  };

  const handleSelectSafetyPoint = (point: SafetyPointResponse) => {
    setSelectedIncident(null); // Clear incident selection
    setSelectedSafetyPoint(point);
    
    const lat = typeof point.latitude === 'number' ? point.latitude : parseFloat(point.latitude as any);
    const lng = typeof point.longitude === 'number' ? point.longitude : parseFloat(point.longitude as any);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      setViewState(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        zoom: 15
      }));
    }
    setRouteData(null);
  };

  const handleRouteToIncident = async () => {
    if (selectedIncident && userLocation) {
      let targetLat = selectedIncident.lat;
      let targetLng = selectedIncident.lng;

      // Nếu không có tọa độ, thử geocode từ địa chỉ
      if (!selectedIncident.hasLocation && selectedIncident.location) {
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(selectedIncident.location)}&limit=1&countrycodes=vn`, {
            headers: { 'User-Agent': 'SosMap-Application/1.0' }
          });
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            targetLat = parseFloat(geoData[0].lat);
            targetLng = parseFloat(geoData[0].lon);
            // Cập nhật state cục bộ để bảo toàn tọa độ khi fetch data
            setGeocodedLocations(prev => ({ ...prev, [selectedIncident.id]: { lat: targetLat, lng: targetLng } }));
            
            // Cập nhật lại incident trong danh sách và selected để hiện marker
            const updatedInc = { ...selectedIncident, lat: targetLat, lng: targetLng, hasLocation: true };
            setRawIncidents(prev => prev.map(r => r.id === selectedIncident.id ? { ...r, latitude: targetLat, longitude: targetLng } : r));
            setSelectedIncident(updatedInc);
          } else {
            toast.error('Không thể tìm thấy vị trí chính xác từ địa chỉ này. Vui lòng tự tìm kiếm trên bản đồ.');
            return;
          }
        } catch (e) {
          console.error('[Geocoding Error]', e);
          toast.error('Lỗi khi tìm kiếm vị trí từ địa chỉ.');
          return;
        }
      }

      fetchRoute(targetLat, targetLng);

      // Tính trung điểm để zoom ra nhìn trọn đường đi
      const midLat = (userLocation.lat + targetLat) / 2;
      const midLng = (userLocation.lng + targetLng) / 2;
      
      const dist = Math.sqrt(Math.pow(userLocation.lat - targetLat, 2) + Math.pow(userLocation.lng - targetLng, 2)) * 111;
      let targetZoom = 14;
      if (dist > 100) targetZoom = 7;
      else if (dist > 50) targetZoom = 8;
      else if (dist > 20) targetZoom = 10;
      else if (dist > 5) targetZoom = 12;

      setViewState(prev => ({
        ...prev,
        latitude: midLat,
        longitude: midLng,
        zoom: targetZoom
      }));
    }
  };

  return {
    viewState,
    setViewState,
    searchQuery,
    setSearchQuery,
    selectedIncident,
    setSelectedIncident,
    selectedSafetyPoint,
    setSelectedSafetyPoint,
    showLegend,
    setShowLegend,
    currentLocation: userLocation,
    isLocating,
    filteredIncidents,
    filteredSafetyPoints,
    handleLocate,
    handleSelectIncident,
    handleSelectSafetyPoint,
    selectedRoutingDistance,
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
    mockTotalCount,
    handleAcceptSos: async () => {
      if (!selectedIncident || !user?.id) return;

      // Bước 1: Kiểm tra xem đã có nhiệm vụ nào chưa
      if (activeTask) {
        toast.error('Bạn hiện đang có một nhiệm vụ khác đang thực hiện. Vui lòng hoàn thành hoặc hủy nhiệm vụ đó trước khi nhận nhiệm vụ mới!');
        return;
      }

      // Bước 2: Tạo RescueTask (Nhiệm vụ mới)
      const res = await rescueTaskService.createTask(selectedIncident.id);
      if (res.success) {
        // Bước 3: Cập nhật status của SOS sang PROCESSING (Nếu backend chưa tự làm)
        await sosService.updateStatus(selectedIncident.id, 'PROCESSING');

        await fetchMapData();
        await fetchActiveTask(user.id);
        setSelectedIncident(null);
      } else {
        toast.error(res.error || 'Không thể tiếp nhận đơn này');
      }
    },
    activeTask,
    showCompleteModal,
    setShowCompleteModal,
    handleCompleteSuccess: async () => {
      await fetchMapData();
      if (user?.id) await fetchActiveTask(user.id);
      setSelectedIncident(null);
    },
    routeData,
    isFollowing,
    setIsFollowing,
    isPanelOpen,
    setIsPanelOpen,
    safetyListLimit,
    incidentListLimit,
    handleLoadMoreIncidents: () => setIncidentListLimit(prev => prev + 10),
    handleLoadMoreSafety: () => setSafetyListLimit(prev => prev + 10),
    mockDataUrl,
    isGenerating,
    setMockDataUrl,
    generateMockData: () => {
      setIsGenerating(true);
      
      setTimeout(() => {
        try {
          const numRecords = 1000;
          const chunks: string[] = ['{"type":"FeatureCollection","features":['];
          
          // Giới hạn Việt Nam theo yêu cầu
          const minLat = 8.5;
          const maxLat = 23.4;
          const minLng = 102.1;
          const maxLng = 109.5;
          
          const mockListIncidents: any[] = [];
          const mockListSafety: any[] = [];
          
          for (let i = 0; i < numRecords; i++) {
            const lat = minLat + Math.random() * (maxLat - minLat);
            const lng = minLng + Math.random() * (maxLng - minLng);
            const isIncident = Math.random() > 0.2;
            const category = isIncident ? 'incident' : 'safetyPoint';
            const type = isIncident ? ['URGENT', 'MEDICAL', 'LOGISTICS', 'FLOOD'][Math.floor(Math.random()*4)] : ['SHELTER', 'HOSPITAL', 'FOOD_STATION'][Math.floor(Math.random()*3)];
            const title = isIncident ? `Yêu cầu SOS ${i}` : `Điểm an toàn ${i}`;
            
            const featureStr = `{"type":"Feature","geometry":{"type":"Point","coordinates":[${lng.toFixed(5)},${lat.toFixed(5)}]},"properties":{"cluster":false,"id":"mock-${i}","category":"${category}","type":"${type}","title":"${title}"}}`;
            
            chunks.push(i === 0 ? featureStr : ',' + featureStr);
            
            // Only push first 1000 to list to avoid out-of-memory in DOM
            if (i < 1000) {
              if (isIncident) {
                mockListIncidents.push(new SosReportResponse({
                  id: `mock-${i}`,
                  latitude: lat,
                  longitude: lng,
                  status: 'ACTIVE',
                  level: type,
                  details: title,
                  address: `Vị trí giả lập ${i}`,
                  createdAt: new Date().toISOString()
                }));
                // Flag to prevent rendering on Map via React Markers
                (mockListIncidents[mockListIncidents.length - 1] as any).isMockListOnly = true;
              } else {
                mockListSafety.push(new SafetyPointResponse({
                  id: `mock-${i}`,
                  name: title,
                  latitude: lat,
                  longitude: lng,
                  type: type,
                  address: `Vị trí giả lập ${i}`,
                  description: 'Dữ liệu sinh ngẫu nhiên'
                }));
                (mockListSafety[mockListSafety.length - 1] as any).isMockListOnly = true;
              }
            }
          }
          chunks.push(']}');
          
          const blob = new Blob(chunks, { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          setMockDataUrl(url);
          setMockTotalCount(numRecords);
          setRawIncidents(prev => [...prev, ...mockListIncidents]);
          setSafetyPoints(prev => [...prev, ...mockListSafety]);
        } catch (e) {
          console.error("Lỗi khi gen 1M data", e);
          toast.error("Trình duyệt không đủ RAM để gen 1 triệu records!");
        } finally {
          setIsGenerating(false);
        }
      }, 100);
    }
  };
}

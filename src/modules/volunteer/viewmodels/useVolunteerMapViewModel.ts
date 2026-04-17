import { useState, useEffect, useMemo } from 'react';
import { useGeolocation } from '../../../core/utils/useGeolocation';

// Default view state for the map
const DEFAULT_VIEW_STATE = {
  latitude: 15.9800,
  longitude: 108.2200,
  zoom: 10,
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
  status: 'ACTIVE' | 'RESPONDING' | 'RESOLVED';
  hasLocation: boolean;
}

import { sosService } from '@/shared/services/sosService';
import { rescueTaskService } from '@/shared/services/rescueTaskService';
import { useAuthStore } from '@/store/authStore';
import { RescueTaskEntity } from '@/shared/entities/RescueTaskEntity';

// Function to calculate distance (in km) between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useVolunteerMapViewModel() {
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  const { location: userLocation, isLocating } = useGeolocation();

  const [rawIncidents, setRawIncidents] = useState<any[]>([]);
  const [hasCentered, setHasCentered] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false); // Mode theo dõi liên tục
  const [routeData, setRouteData] = useState<any>(null);
  const [activeTask, setActiveTask] = useState<RescueTaskEntity | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const { user } = useAuthStore();

  const fetchRoute = async (endLat: number, endLng: number) => {
    if (!userLocation) return;
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${endLng},${endLat}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        setRouteData(data.routes[0].geometry);
      } else {
        setRouteData(null);
      }
    } catch (e) {
      console.error('OSRM Routing Error', e);
      setRouteData(null);
    }
  };

  useEffect(() => {
    fetchIncidents();
    if (user?.id) {
      fetchActiveTask(user.id);
    }
  }, [user?.id]); // ONLY refetch when user changes (on mount/logout)

  const fetchActiveTask = async (uid: string) => {
    const { data } = await rescueTaskService.getMyActiveTask(uid);
    setActiveTask(data);
  };

  const fetchIncidents = async () => {
    try {
      const { data } = await sosService.getSosReports();
      // Store raw data
      setRawIncidents(data || []);
    } catch (e) {
      console.error('[VolunteerMap] fetch incidents error:', e);
    }
  };

  // Mapped incidents with distance and timeAgo calculation
  const incidents = useMemo<Incident[]>(() => {
    return rawIncidents
      .filter(r => r.status?.toUpperCase() !== 'PENDING')
      .filter(r => !['COMPLETED', 'CLOSED', 'RESOLVED', 'DONE'].includes(r.status?.toUpperCase() || ''))
      .map(r => {
        const lat = typeof r.latitude === 'number' ? r.latitude : parseFloat(r.latitude as any);
        const lng = typeof r.longitude === 'number' ? r.longitude : parseFloat(r.longitude as any);
        const hasLocation = !isNaN(lat) && !isNaN(lng);

        let distanceStr = '';
        if (userLocation && hasLocation) {
          const dist = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
          distanceStr = dist < 1 ? '<1km' : dist.toFixed(1) + 'km';
        }

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
          status: (['PROCESSING', 'APPROVED', 'RESPONDING'].includes(r.status?.toUpperCase() || '')) ? 'RESPONDING' : 'ACTIVE',
          hasLocation
        } as Incident;
      });
  }, [rawIncidents, userLocation]); // Recalculate distance when user moves, NO API CALL

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

  const filteredIncidents = incidents.filter(i =>
    !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    setSelectedIncident(inc);
    setViewState(prev => ({
      ...prev,
      latitude: inc.lat,
      longitude: inc.lng,
      zoom: 15
    }));
    setRouteData(null); // Xóa đường cũ khi chọn sự cố mới
  };

  const handleRouteToIncident = () => {
    if (selectedIncident && userLocation) {
      fetchRoute(selectedIncident.lat, selectedIncident.lng);

      // Tính trung điểm để zoom ra nhìn trọn đường đi
      const midLat = (userLocation.lat + selectedIncident.lat) / 2;
      const midLng = (userLocation.lng + selectedIncident.lng) / 2;
      setViewState(prev => ({
        ...prev,
        latitude: midLat,
        longitude: midLng,
        zoom: 12
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
    showLegend,
    setShowLegend,
    userLocation,
    isLocating,
    filteredIncidents,
    handleLocate,
    handleSelectIncident,
    handleRouteToIncident,
    handleAcceptSos: async () => {
      if (!selectedIncident || !user?.id) return;

      // Bước 1: Kiểm tra xem đã có nhiệm vụ nào chưa
      if (activeTask) {
        alert('Bạn hiện đang có một nhiệm vụ khác đang thực hiện. Vui lòng hoàn thành hoặc hủy nhiệm vụ đó trước khi nhận nhiệm vụ mới!');
        return;
      }

      // Bước 2: Tạo RescueTask (Nhiệm vụ mới)
      const res = await rescueTaskService.createTask(selectedIncident.id);
      if (res.success) {
        // Bước 3: Cập nhật status của SOS sang PROCESSING (Nếu backend chưa tự làm)
        await sosService.updateStatus(selectedIncident.id, 'PROCESSING');

        await fetchIncidents();
        await fetchActiveTask(user.id);
        setSelectedIncident(null);
      } else {
        alert(res.error || 'Không thể tiếp nhận đơn này');
      }
    },
    activeTask,
    showCompleteModal,
    setShowCompleteModal,
    handleCompleteSuccess: async () => {
      await fetchIncidents();
      if (user?.id) await fetchActiveTask(user.id);
      setSelectedIncident(null);
    },
    routeData,
    isFollowing,
    setIsFollowing
  };
}

import { useState, useEffect, useMemo } from 'react';
import type { SosReportResponse, SafetyPointResponse, MapFilterType } from '@/shared/entities/MapEntity';
import { mapService } from '@/shared/services/mapService';
import { useGeolocation } from '../../../core/utils/useGeolocation';

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

// Default center: Hồ Chí Minh, Vietnam
const DEFAULT_CENTER = {
  longitude: 106.6710,
  latitude: 10.7816,
  zoom: 12
};

export function useMapViewModel() {
  const [sosReports, setSosReports] = useState<SosReportResponse[]>([]);
  const [safetyPoints, setSafetyPoints] = useState<SafetyPointResponse[]>([]);
  const [filterType, setFilterType] = useState<MapFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewState, setViewState] = useState(DEFAULT_CENTER);

  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [hasCentered, setHasCentered] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false); // Mode theo dõi liên tục
  const [selectedSosReport, setSelectedSosReport] = useState<SosReportResponse | null>(null);
  const [selectedSafetyPoint, setSelectedSafetyPoint] = useState<SafetyPointResponse | null>(null);

  // Geolocation integration
  const { location: userLiveLocation, isLocating } = useGeolocation();

  if (userLiveLocation) {
    if (userLiveLocation.accuracy && userLiveLocation.accuracy > 5000) {
      console.warn("Vị trí này có độ chính xác thấp (có thể định vị qua IP)");
    }
  }

  // Tự động nhảy tới vị trí người dùng khi map tải xong toạ độ
  useEffect(() => {
    if (!userLiveLocation) return;

    // Lần đầu tiên có location => căn giữa
    if (!hasCentered) {
      const isAccurate = userLiveLocation.accuracy && userLiveLocation.accuracy < 200;
      if (isAccurate) {
        setViewState(prev => ({
          ...prev,
          longitude: userLiveLocation.lng,
          latitude: userLiveLocation.lat,
          zoom: 15
        }));
        setHasCentered(true);
        setIsFollowing(true); // Bắt đầu ở chế độ follow me
      } else {
        const timeout = setTimeout(() => {
          setViewState(prev => ({
            ...prev,
            longitude: userLiveLocation.lng,
            latitude: userLiveLocation.lat,
            zoom: 14
          }));
          setHasCentered(true);
        }, 3000);
        return () => clearTimeout(timeout);
      }
    } else if (isFollowing) {
      // Đang bật chế độ follow me => tự động di chuyển map theo user
      setViewState(prev => ({
        ...prev,
        longitude: userLiveLocation.lng,
        latitude: userLiveLocation.lat
      }));
    }
  }, [userLiveLocation, hasCentered, isFollowing]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sosResp, safetyResp] = await Promise.all([
        mapService.getSosReports(),
        mapService.getSafetyPoints()
      ]);
      // Chỉ hiện các SOS đã duyệt hoặc đang xử lý
      const activeSos = (sosResp.data || []).filter(r =>
        ['APPROVED', 'PROCESSING'].includes((r.status || '').toUpperCase())
      );
      setSosReports(activeSos);
      setSafetyPoints(safetyResp.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Logic filter
  const filteredSosReports = useMemo(() => {
    return sosReports.filter(report => {
      // Lọc theo search (Address)
      const matchesSearch = !searchQuery || report.address?.toLowerCase().includes(searchQuery.toLowerCase());

      // Lọc theo Filter Tab
      let matchesFilter = true;
      const reportLevel = (report.level || '').toUpperCase();

      if (filterType === 'ALL') {
        matchesFilter = true;
      } else if (filterType === 'URGENT') {
        matchesFilter = reportLevel === 'URGENT' || reportLevel === 'HIGH' || reportLevel === 'CRITICAL';
      } else if (filterType === 'MEDICAL') {
        matchesFilter = reportLevel === 'MEDICAL';
      } else if (filterType === 'LOGISTICS' || filterType === 'FOOD') {
        matchesFilter = reportLevel === 'LOGISTICS';
      } else if (filterType === 'FLOOD') {
        matchesFilter = reportLevel === 'FLOOD';
      } else if (filterType === 'SAFETY') {
        matchesFilter = false; 
      }
      return matchesSearch && matchesFilter;
    }).map(report => {
      let distanceStr = '';
      if (userLiveLocation && report.latitude && report.longitude) {
        const dist = calculateDistance(userLiveLocation.lat, userLiveLocation.lng, parseFloat(report.latitude as any), parseFloat(report.longitude as any));
        distanceStr = dist < 1 ? '<1km' : dist.toFixed(1) + 'km';
      }
      return { ...report, distanceStr } as any;
    });
  }, [sosReports, filterType, searchQuery, userLiveLocation]);

  const filteredSafetyPoints = useMemo(() => {
    if (filterType === 'ALL' || filterType === 'SAFETY') {
      return safetyPoints.filter(point =>
        !searchQuery || point.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(point => {
        let distanceStr = '';
        if (userLiveLocation && point.latitude && point.longitude) {
          const dist = calculateDistance(userLiveLocation.lat, userLiveLocation.lng, parseFloat(point.latitude as any), parseFloat(point.longitude as any));
          distanceStr = dist < 1 ? '<1km' : dist.toFixed(1) + 'km';
        }
        return { ...point, distanceStr } as any;
      });
    }
    return []; // Only show safety points if 'ALL' or 'SAFETY' is selected
  }, [safetyPoints, filterType, searchQuery, userLiveLocation]);

  return {
    sosReports: filteredSosReports,
    safetyPoints: filteredSafetyPoints,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    viewState,
    setViewState,
    isLoading,
    isSosModalOpen,
    setIsSosModalOpen,
    userLiveLocation,
    isLocating,
    selectedSosReport,
    setSelectedSosReport,
    selectedSafetyPoint,
    setSelectedSafetyPoint,
    isFollowing,
    setIsFollowing
  };
}

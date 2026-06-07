import { useState, useEffect, useMemo } from 'react';
import type { SosReportResponse, SafetyPointResponse, MapFilterType } from '@/shared/entities/MapEntity';
import { mapService } from '@/shared/services/mapService';
import { useGeolocation } from '../../../core/utils/useGeolocation';



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
  const [selectedRoutingDistance, setSelectedRoutingDistance] = useState<string | null>(null);
  const [routingDistances, setRoutingDistances] = useState<Record<string, number>>({});

  // Geolocation integration
  const { location: userLiveLocation, isLocating } = useGeolocation();

  // Fetch matrix distances
  useEffect(() => {
    if (!userLiveLocation || (sosReports.length === 0 && safetyPoints.length === 0)) return;
    let active = true;

    const topIncidents = sosReports
      .map(r => {
        const lat = typeof r.latitude === 'number' ? r.latitude : parseFloat(r.latitude as any);
        const lng = typeof r.longitude === 'number' ? r.longitude : parseFloat(r.longitude as any);
        return { id: r.id, lat, lng };
      })
      .filter(r => !isNaN(r.lat) && !isNaN(r.lng))
      .slice(0, 50);

    const topSafetyPoints = safetyPoints
      .filter(p => p.latitude && p.longitude)
      .map(p => {
        const lat = typeof p.latitude === 'number' ? p.latitude : parseFloat(p.latitude as any);
        const lng = typeof p.longitude === 'number' ? p.longitude : parseFloat(p.longitude as any);
        return { id: p.id, lat, lng };
      })
      .slice(0, 50);

    const destinations = [...topIncidents, ...topSafetyPoints];
    if (destinations.length === 0) return;

    import('@/shared/services/routingService').then(({ routingService }) => {
      routingService.getDistanceMatrix(
        { lng: userLiveLocation.lng, lat: userLiveLocation.lat },
        destinations.map(d => ({ lng: d.lng, lat: d.lat }))
      ).then(distances => {
        if (!active || !distances) return;
        const newRoutingMap: Record<string, number> = {};
        destinations.forEach((d, i) => {
          newRoutingMap[d.id] = distances[i];
        });
        setRoutingDistances(newRoutingMap);
      });
    });

    return () => { active = false; };
  }, [sosReports, safetyPoints, userLiveLocation]);

  if (userLiveLocation) {
    if (userLiveLocation.accuracy && userLiveLocation.accuracy > 5000) {
      console.warn("Vị trí này có độ chính xác thấp (có thể định vị qua IP)");
    }
  }

  // Calculate routing distance when selecting a point
  useEffect(() => {
    let active = true;
    const calculateRoute = async () => {
      if (!userLiveLocation) return;
      
      const target = selectedSosReport || selectedSafetyPoint;
      if (!target || !target.latitude || !target.longitude) {
        setSelectedRoutingDistance(null);
        return;
      }
      
      setSelectedRoutingDistance('Đang tính...');
      const lat = parseFloat(target.latitude as any);
      const lng = parseFloat(target.longitude as any);
      
      if (isNaN(lat) || isNaN(lng)) {
        setSelectedRoutingDistance(null);
        return;
      }
      
      try {
        const { routingService } = await import('@/shared/services/routingService');
        const distanceKm = await routingService.getShortestPathDistance(userLiveLocation.lng, userLiveLocation.lat, lng, lat);
        
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
    
    calculateRoute();
    return () => { active = false; };
  }, [selectedSosReport, selectedSafetyPoint, userLiveLocation]);

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
      let distanceStr = 'Đang tính...';
      let rawDistance = Infinity;
      if (routingDistances[report.id] !== undefined) {
        rawDistance = routingDistances[report.id];
        distanceStr = rawDistance < 1 ? '<1km' : rawDistance.toFixed(1) + 'km';
      } else if (!report.latitude || !report.longitude) {
        distanceStr = 'Chưa xác định';
      }
      return { ...report, distanceStr, rawDistance } as any;
    }).sort((a: any, b: any) => (a.rawDistance || Infinity) - (b.rawDistance || Infinity));
  }, [sosReports, filterType, searchQuery, routingDistances]);

  const filteredSafetyPoints = useMemo(() => {
    if (filterType === 'ALL' || filterType === 'SAFETY') {
      return safetyPoints.filter(point =>
        !searchQuery || point.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(point => {
        let distanceStr = 'Đang tính...';
        let rawDistance = Infinity;
        if (routingDistances[point.id] !== undefined) {
          rawDistance = routingDistances[point.id];
          distanceStr = rawDistance < 1 ? '<1km' : rawDistance.toFixed(1) + 'km';
        } else if (!point.latitude || !point.longitude) {
          distanceStr = 'Chưa xác định';
        }
        return { ...point, distanceStr, rawDistance } as any;
      }).sort((a: any, b: any) => (a.rawDistance || Infinity) - (b.rawDistance || Infinity));
    }
    return []; // Only show safety points if 'ALL' or 'SAFETY' is selected
  }, [safetyPoints, filterType, searchQuery, routingDistances]);

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
    selectedRoutingDistance,
    isFollowing,
    setIsFollowing
  };
}

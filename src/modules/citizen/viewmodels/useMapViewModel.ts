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

  // Geolocation integration
  const { location: userLiveLocation, isLocating } = useGeolocation();

  if (userLiveLocation) {
    console.log(`Độ sai số: ${userLiveLocation.accuracy} mét`);

    if (userLiveLocation.accuracy && userLiveLocation.accuracy > 5000) {
      console.warn("Vị trí này có độ chính xác thấp (có thể định vị qua IP)");
    }
  }

  // Tự động nhảy tới vị trí người dùng khi map tải xong toạ độ
  useEffect(() => {
    if (!userLiveLocation || hasCentered) return;

    // Chỉ căn giữa nếu toạ độ có độ chính xác tốt (dưới 200m - thường là GPS thực)
    // Hoặc sau 3s nếu vẫn chưa có toạ độ tốt hơn toạ độ hiện tại
    const isAccurate = userLiveLocation.accuracy && userLiveLocation.accuracy < 200;

    if (isAccurate) {
      setViewState(prev => ({
        ...prev,
        longitude: userLiveLocation.lng,
        latitude: userLiveLocation.lat,
        zoom: 14
      }));
      setHasCentered(true);
    } else {
      // Nếu chưa đủ chính xác, đặt một timeout để "chấp nhận" toạ độ này sau 3s nếu không có gì tốt hơn
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
  }, [userLiveLocation, hasCentered]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Gọi API song song
      const [sosResp, safetyResp] = await Promise.all([
        mapService.getSosReports(),
        mapService.getSafetyPoints()
      ]);
      setSosReports(sosResp.data || []);
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
      if (filterType === 'ALL') {
        matchesFilter = true;
      } else if (filterType === 'URGENT') {
        matchesFilter = report.level === 'HIGH' || report.level === 'CRITICAL';
      } else if (filterType === 'MEDICAL') {
        matchesFilter = (report.details?.toLowerCase().includes('y tế') || report.details?.toLowerCase().includes('thuốc')) || false;
      } else if (filterType === 'FOOD') {
        matchesFilter = (report.details?.toLowerCase().includes('thực phẩm') || report.details?.toLowerCase().includes('ăn') || report.details?.toLowerCase().includes('uống')) || false;
      } else if (filterType === 'SHELTER') {
        matchesFilter = (report.details?.toLowerCase().includes('chỗ ở') || report.details?.toLowerCase().includes('trú')) || false;
      } else if (filterType === 'FLOOD') {
        matchesFilter = report.details?.toLowerCase().includes('ngập') || false;
      } else if (filterType === 'SAFETY') {
        matchesFilter = false; // Safety points are handled separately
      }
      return matchesSearch && matchesFilter;
    });
  }, [sosReports, filterType, searchQuery]);

  const filteredSafetyPoints = useMemo(() => {
    if (filterType === 'ALL' || filterType === 'SAFETY') {
      return safetyPoints.filter(point =>
        !searchQuery || point.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return []; // Only show safety points if 'ALL' or 'SAFETY' is selected
  }, [safetyPoints, filterType, searchQuery]);

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
    isLocating
  };
}

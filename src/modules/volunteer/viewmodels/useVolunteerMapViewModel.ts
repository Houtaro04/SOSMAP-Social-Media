import { useState, useEffect } from 'react';
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
}

const INCIDENTS: Incident[] = [
  { id: '1', type: 'URGENT', title: 'Cần thuyền cứu hộ khẩn cấp', location: 'Duy Vinh, Quảng Nam', timeAgo: 'Vừa xong', distance: '1.2km', lat: 15.8100, lng: 108.2608, status: 'ACTIVE' },
  { id: '2', type: 'MEDICAL', title: 'Người già khó thở', location: 'Liên Chiểu, Đà Nẵng', timeAgo: '5p', distance: '2.4km', lat: 16.0700, lng: 108.1200, status: 'ACTIVE' },
  { id: '3', type: 'LOGISTICS', title: 'Thiếu nước sạch', location: 'Cẩm Lệ, Đà Nẵng', timeAgo: '12p', distance: '3.1km', lat: 16.0200, lng: 108.2100, status: 'RESPONDING' },
  { id: '4', type: 'FLOOD', title: 'Khu vực ngập sâu 1.5m', location: 'Điện Bàn, Quảng Nam', timeAgo: '18p', distance: '4.8km', lat: 15.8900, lng: 108.2400, status: 'ACTIVE' },
  { id: '5', type: 'MEDICAL', title: 'Trẻ em sốt cao', location: 'Hải Châu, Đà Nẵng', timeAgo: '25p', distance: '5.6km', lat: 16.0680, lng: 108.2200, status: 'RESPONDING' },
  { id: '6', type: 'URGENT', title: 'Di tản khẩn cấp', location: 'Trà Leng, Quảng Nam', timeAgo: '30p', distance: '7.2km', lat: 15.5800, lng: 107.9500, status: 'ACTIVE' },
];

export function useVolunteerMapViewModel() {
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  const { location: userLocation, isLocating } = useGeolocation();

  const [hasCentered, setHasCentered] = useState(false);

  // Tự động căn giữa map khi lần đầu lấy được vị trí
  useEffect(() => {
    if (!userLocation || hasCentered) return;

    // Chỉ căn giữa nếu toạ độ có độ chính xác tốt (dưới 200m)
    const isAccurate = userLocation.accuracy && userLocation.accuracy < 200;

    if (isAccurate) {
      setViewState(prev => ({
        ...prev,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        zoom: 13
      }));
      setHasCentered(true);
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
  }, [userLocation, hasCentered]);

  const filteredIncidents = INCIDENTS.filter(i =>
    !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLocate = () => {
    if (userLocation) {
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
    handleSelectIncident
  };
}

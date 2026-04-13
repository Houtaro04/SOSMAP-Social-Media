import { useState, useEffect } from 'react';

interface LocationState {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function useGeolocation() {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Trình duyệt của bạn không hỗ trợ định vị.');
      setIsLocating(false);
      return;
    }

    // Sử dụng watchPosition để cập nhật vị trí thời gian thực
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setIsLocating(false);
      },
      (err) => {
        setError(err.message || 'Không thể lấy vị trí hiện tại. Vui lòng cấp quyền truy cập!');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, error, isLocating };
}

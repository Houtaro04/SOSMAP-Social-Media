import { useState, useCallback, useEffect } from 'react';
import { sosService } from '@/shared/services/sosService';
import { useAuthStore } from '@/store/authStore';

export function useSosFormViewModel(onCloseFunc: () => void, onSuccessFunc?: () => void, initialLocation?: { lat: number, lng: number }, userId?: string) {
  const user = useAuthStore(state => state.user);

  const [formData, setFormData] = useState<any>({
    fullName: user?.fullName || '',
    phoneNumber: user?.phone || '',
    address: user?.address || '',
    details: '',
    latitude: initialLocation?.lat,
    longitude: initialLocation?.lng,
    level: 'URGENT',
    userId: userId || user?.id,
  });

  // Tự động phân tích tọa độ thành địa chỉ (Reverse Geocoding)
  useEffect(() => {
    if (initialLocation?.lat && initialLocation?.lng) {
      // Chỉ tự động điền nếu user chưa chạm vào ô địa chỉ (tức là nó đang rỗng hoặc giống nguyên gốc profile)
      if (!formData.address || formData.address === user?.address) {
        const fetchAddress = async () => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${initialLocation.lat}&lon=${initialLocation.lng}&zoom=18&addressdetails=1`, {
              headers: {
                'Accept-Language': 'vi',
                'User-Agent': 'SosMap-Application/1.0'
              }
            });
            const data = await res.json();
            if (data && data.display_name) {
              setFormData((prev: any) => ({ ...prev, address: data.display_name }));
            }
          } catch (e) {
            console.error('Reverse Geocoding Error:', e);
          }
        };
        // Delay nhẹ để tránh gọi API quá nhanh nếu location thay đổi liên tục
        const timer = setTimeout(fetchAddress, 800);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLocation?.lat, initialLocation?.lng]);

  // Sync coordinates if they become available later
  useEffect(() => {
    if (initialLocation?.lat && initialLocation?.lng) {
      setFormData((prev: any) => ({
        ...prev,
        latitude: prev.latitude || initialLocation.lat,
        longitude: prev.longitude || initialLocation.lng,
      }));
    }
  }, [initialLocation?.lat, initialLocation?.lng]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  }, []);

  const submitForm = useCallback(async () => {
    setMessage(null);
    setIsSubmitting(true);
    try {
      const res = await sosService.submitSosRequest(formData);
      if (res.success) {
        setMessage({ type: 'success', text: 'Đã gửi yêu cầu SOS thành công!' });
        if (onSuccessFunc) onSuccessFunc();

        // Thành công => đóng form sau 2 giây
        setTimeout(() => {
          onCloseFunc();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: res.error || 'Lỗi gửi yêu cầu!' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Lỗi gửi yêu cầu!' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onCloseFunc]);

  const resetForm = useCallback(() => {
    setFormData({
      fullName: user?.fullName || '',
      phoneNumber: user?.phone || '',
      address: user?.address || '',
      details: '',
      latitude: initialLocation?.lat,
      longitude: initialLocation?.lng,
      level: 'URGENT',
      userId: userId || user?.id,
    });
    setMessage(null);
    setIsSubmitting(false);
  }, [user?.fullName, user?.phone, user?.address, user?.id, initialLocation?.lat, initialLocation?.lng, userId]);

  return {
    formData,
    isSubmitting,
    message,
    handleInputChange,
    submitForm,
    resetForm
  };
}

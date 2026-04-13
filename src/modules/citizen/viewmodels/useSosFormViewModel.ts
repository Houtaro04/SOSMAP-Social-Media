import { useState, useCallback } from 'react';
import { sosService } from '@/shared/services/sosService';

export function useSosFormViewModel(onCloseFunc: () => void, onSuccessFunc?: () => void, initialLocation?: { lat: number, lng: number }, userId?: string) {
  const [formData, setFormData] = useState<any>({
    fullName: '',
    phoneNumber: '',
    address: '',
    details: '',
    latitude: initialLocation?.lat,
    longitude: initialLocation?.lng,
    level: 'LOW',
    userId: userId, // Bổ sung userId để tránh lỗi FK
    images: []
  });

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

  return {
    formData,
    isSubmitting,
    message,
    handleInputChange,
    submitForm
  };
}

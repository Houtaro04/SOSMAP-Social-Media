import React, { useState } from 'react';
import { X, MapPin, Save, ShieldCheck, Loader2, Search } from 'lucide-react';
import { SafetyPointResponse } from '@/shared/entities/MapEntity';
import '@/styles/SafetyPointModal.css';

interface SafetyPointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (point: Partial<SafetyPointResponse>) => Promise<boolean>;
  userLocation: { lat: number; lng: number } | null;
  isSubmitting: boolean;
}

export const SafetyPointModal: React.FC<SafetyPointModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userLocation,
  isSubmitting
}) => {
  // Use strings for coordinates during editing to allow manual entry of decimal points and signs
  const [formData, setFormData] = useState<any>({
    name: '',
    type: 'Shelter',
    address: '',
    description: '',
    latitude: String(userLocation?.lat || 0),
    longitude: String(userLocation?.lng || 0)
  });

  const [error, setError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Sync with userLocation only when it changes and formData is empty or at default
  React.useEffect(() => {
    if (userLocation && formData.latitude === '0' && formData.longitude === '0' && formData.name === '') {
      setFormData((prev: any) => ({
        ...prev,
        latitude: String(userLocation.lat),
        longitude: String(userLocation.lng)
      }));
    }
  }, [userLocation]);

  if (!isOpen) return null;

  const handleLookupAddress = async () => {
    if (!formData.address?.trim()) {
      setError('Vui lòng nhập địa chỉ trước khi tìm kiếm.');
      return;
    }

    setIsGeocoding(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData((prev: any) => ({
          ...prev,
          latitude: String(lat),
          longitude: String(lon)
        }));
      } else {
        setError('Không tìm thấy tọa độ cho địa chỉ này. Vui lòng kiểm tra lại hoặc nhập thủ công.');
      }
    } catch (e) {
      console.error('Geocoding error:', e);
      setError('Có lỗi xảy ra khi tìm kiếm địa chỉ.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name?.trim()) {
      setError('Vui lòng nhập tên điểm an toàn.');
      return;
    }

    // Convert strings back to numbers for submission
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Tọa độ cung cấp không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    const payload = {
      ...formData,
      latitude: lat,
      longitude: lng
    };

    const success = await onSubmit(payload);
    if (!success) {
      setError('Có lỗi xảy ra khi thêm điểm an toàn.');
    }
  };

  const useCurrentLocation = () => {
    if (userLocation) {
      setFormData((prev: any) => ({
        ...prev,
        latitude: String(userLocation.lat),
        longitude: String(userLocation.lng)
      }));
    }
  };

  return (
    <div className="sp-modal-overlay">
      <div className="sp-modal-content">
        <header className="sp-modal-header">
          <div className="sp-header-title">
            <ShieldCheck className="sp-icon-green" />
            <h3>Thêm điểm an toàn mới</h3>
          </div>
          <button className="sp-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="sp-form">
          {error && (
            <div className="sp-error-banner">
              {error}
            </div>
          )}

          <div className="sp-form-group">
            <label>Tên điểm an toàn *</label>
            <input
              type="text"
              name="name"
              placeholder="Ví dụ: Nhà văn hóa, Trụ sở UBND..."
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="sp-form-row">
            <div className="sp-form-group">
              <label>Loại điểm</label>
              <select name="type" value={formData.type || ''} onChange={handleChange}>
                <option value="Shelter">Nơi trú ẩn (Shelter)</option>
                <option value="Food">Điểm cấp thực phẩm</option>
                <option value="Medical">Trạm y tế lưu động</option>
                <option value="Safety">Khu vực an toàn</option>
                <option value="Other">Khác</option>
              </select>
            </div>
          </div>

          <div className="sp-form-group">
            <div className="sp-field-header">
              <label>Địa chỉ cụ thể</label>
              <button 
                type="button" 
                className="btn-lookup-address" 
                onClick={handleLookupAddress}
                disabled={isGeocoding}
              >
                {isGeocoding ? (
                  <Loader2 className="animate-spin" size={12} />
                ) : (
                  <Search size={12} />
                )}
                Tìm tọa độ
              </button>
            </div>
            <textarea
              name="address"
              rows={2}
              placeholder="Số nhà, tên đường, phường/xã..."
              value={formData.address || ''}
              onChange={handleChange}
            />
          </div>

          <div className="sp-form-group">
            <label>Mô tả chi tiết</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Thông tin thêm giúp người dân nhận diện..."
              value={formData.description || ''}
              onChange={handleChange}
            />
          </div>

          <div className="sp-coords-section">
            <div className="sp-coords-header">
              <label>Tọa độ (GPS)</label>
              {userLocation && (
                <button type="button" className="btn-use-gps" onClick={useCurrentLocation}>
                  <MapPin size={12} /> Lấy vị trí của tôi
                </button>
              )}
            </div>
            <div className="sp-form-row">
              <div className="sp-form-group">
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  placeholder="Vĩ độ (Lat)"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="sp-form-group">
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  placeholder="Kinh độ (Lng)"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <footer className="sp-modal-footer">
            <button type="button" className="sp-btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </button>
            <button type="submit" className="sp-btn-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Đang lưu...
                </>
              ) : (
                <>
                  <Save size={18} /> Lưu điểm an toàn
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

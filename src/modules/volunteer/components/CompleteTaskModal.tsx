import React, { useState, useRef } from 'react';
import { Camera, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { rescueTaskService } from '@/shared/services/rescueTaskService';
import '@/styles/CompleteTaskModal.css';

interface CompleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  reportId: string;
  onSuccess: () => void;
}

export const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({ 
  isOpen, 
  onClose, 
  taskId, 
  reportId,
  onSuccess 
}) => {
  const [note, setNote] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      setError('Vui lòng tải lên ảnh xác minh hoàn thành nhiệm vụ.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Cập nhật trạng thái RescueTask sang COMPLETED kèm ảnh xác minh và ghi chú
      const res = await rescueTaskService.updateStatus(taskId, 'COMPLETED', note || 'Đã hoàn thành cứu trợ', imageFile);
      
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Có lỗi xảy ra khi hoàn thành nhiệm vụ.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi hệ thống khi xử lý.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ctm-overlay">
      <div className="ctm-content">
        <button className="ctm-close" onClick={onClose} disabled={isSubmitting}>
          <X size={20} />
        </button>

        <div className="ctm-header">
          <div className="ctm-icon-bg">
            <CheckCircle size={32} color="#10B981" />
          </div>
          <h2>Xác nhận hoàn thành</h2>
          <p>Gửi ảnh và ghi chú để minh chứng bạn đã hoàn thành việc hỗ trợ đơn cứu trợ này.</p>
        </div>

        {error && (
          <div className="ctm-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="ctm-body">
          <label className="ctm-label">ẢNH XÁC MINH <span className="req">*</span></label>
          <div 
            className={`ctm-upload-zone ${imagePreview ? 'has-image' : ''}`}
            onClick={() => !isSubmitting && fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="ctm-preview" />
            ) : (
              <div className="ctm-upload-placeholder">
                <Camera size={32} />
                <span>Bấm để chụp hoặc chọn ảnh</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              hidden 
            />
          </div>

          <label className="ctm-label">GHI CHÚ THÊM</label>
          <textarea
            className="ctm-textarea"
            placeholder="Bạn đã hỗ trợ những gì? (vd: Đã gửi 5 thùng mì tôm tại nhà văn hóa...)"
            value={note}
            onChange={e => setNote(e.target.value)}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        <div className="ctm-footer">
          <button 
            className="ctm-btn-cancel" 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button 
            className="ctm-btn-submit" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                ĐANG GỬI...
              </>
            ) : (
              'XÁC NHẬN HOÀN THÀNH'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

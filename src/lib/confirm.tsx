import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { AlertCircle } from 'lucide-react';
import './confirm.css';

export const showConfirm = (message: string, title = 'Xác nhận'): Promise<boolean> => {
  return new Promise((resolve) => {
    confirmAlert({
      title: title,
      message: message,
      customUI: ({ onClose }) => {
        return (
          <div className="custom-confirm-overlay">
            <div className="custom-confirm-dialog">
              <div className="custom-confirm-header">
                <div className="custom-confirm-icon">
                  <AlertCircle size={32} strokeWidth={1.5} />
                </div>
                <h2>{title}</h2>
              </div>
              <p className="custom-confirm-message">{message}</p>
              <div className="custom-confirm-actions">
                <button 
                  className="custom-confirm-btn custom-confirm-btn-cancel"
                  onClick={() => {
                    resolve(false);
                    onClose();
                  }}
                >
                  Hủy
                </button>
                <button 
                  className="custom-confirm-btn custom-confirm-btn-confirm"
                  onClick={() => {
                    resolve(true);
                    onClose();
                  }}
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        );
      },
      closeOnEscape: false,
      closeOnClickOutside: false,
    });
  });
};

import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

export const showConfirm = (message: string, title = 'Xác nhận'): Promise<boolean> => {
  return new Promise((resolve) => {
    confirmAlert({
      title: title,
      message: message,
      buttons: [
        {
          label: 'Đồng ý',
          onClick: () => resolve(true)
        },
        {
          label: 'Hủy',
          onClick: () => resolve(false)
        }
      ],
      closeOnEscape: false,
      closeOnClickOutside: false,
    });
  });
};

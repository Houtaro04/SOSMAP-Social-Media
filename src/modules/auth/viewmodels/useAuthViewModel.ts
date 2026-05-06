import { useState, useCallback, useEffect } from 'react';
import { 
  SendOtpRequest, 
  VerifyOtpRequest, 
  AuthValidator 
} from '@/shared/entities/AuthEntity';
import type { UserRole } from '@/shared/entities/AuthEntity';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/shared/services/authService';
import { profileService } from '@/shared/services/profileService';

export function useAuthViewModel() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<UserRole>('CITIZEN');

  // Trạng thái quản lý luồng: EMAIL -> OTP
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [countdown, setCountdown] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { login, updateUser } = useAuthStore();
  const navigate = useNavigate();

  // Bước 1: Gửi OTP ngay sau khi nhập email
  const handleCheckEmail = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const emailValidation = AuthValidator.validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error);
      return;
    }

    setIsLoading(true);
    try {
      // Go thang den buoc gui OTP, khong check-user nua
      const otpResp = await authService.sendOtp(new SendOtpRequest({ email, role }));
      setSuccessMessage(otpResp.message);
      setStep('OTP');
    } catch (err: any) {
      setError(err.message || 'Lỗi gửi mã xác thực.');
    } finally {
      setIsLoading(false);
    }
  }, [email, role]);

  // Bước 1.6: Gửi lại OTP
  const handleResendOtp = useCallback(async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await authService.sendOtp({ email, role });
      setSuccessMessage('Đã gửi lại mã: ' + response.message);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi gửi lại OTP.');
    } finally {
      setIsLoading(false);
    }
  }, [email, role, countdown]);

  useEffect(() => {
    if (countdown > 0) {
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [countdown]);

  // Bước 2: Xác thực OTP
  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const otpValidation = AuthValidator.validateOTP(otp);
    if (!otpValidation.isValid) {
      setError(otpValidation.error);
      return;
    }
    setIsLoading(true);
    try {
      // Gửi đúng role đã chọn ở UI lên backend
      const authResponse = await authService.verifyOtp(new VerifyOtpRequest({ email, otpCode: otp, role }));
      
      // Debugging: Log root response for structure inspection
      console.log('[Auth] Verify Response Raw:', authResponse);

      if (authResponse.success || authResponse.data.token) {
        const userData = authResponse.data.user;
        const userRoleFromDb = userData.role || '';

        // KIỂM TRA VAI TRÒ: Nếu role trong DB khác với role đã chọn ở tab UI -> Từ chối
        // So sánh không phân biệt hoa thường để tránh lỗi "citizen" vs "CITIZEN"
        if (userRoleFromDb.toString().toUpperCase() !== role.toUpperCase()) {
          setError('Bạn không có thẩm quyền đăng nhập');
          setIsLoading(false);
          return;
        }

        // Lưu Token, User VÀ role đã chọn từ UI vào store
        login(authResponse.data, role);

        // ─── ĐỒNG BỘ PROFILE CHI TIẾT SAU LOGIN (Lấy ID, Address, ImageUrl...) ───
        try {
          const profileResp = await profileService.getProfile();
          if (profileResp.data) {
            const u = profileResp.data;
            updateUser({
              id: u.id,
              fullName: u.fullName,
              phone: u.phone,
              email: u.email,
              address: u.address,
              imageUrl: u.imageUrl,
              status: u.status
            });
          }
        } catch (profileErr) {
          console.error('[Auth] Sync profile error:', profileErr);
        }

        console.log('[Auth] Login response:', authResponse);
        console.log('[Auth] UI Selected Role:', role);

        // Điều hướng dựa vào trạng thái tài khoản
        if (userData.status === 'LOCKED' || userData.status === 'BANNED') {
          navigate('/locked', { replace: true });
          return;
        }

        // Điều hướng dựa vào role UI đã chọn
        if (role === 'VOLUNTEER') {
          navigate('/volunteer');
        } else {
          // Người dân vào /citizen
          navigate('/citizen');
        }
      } else {
        setError(authResponse.message);
      }
    } catch (err: any) {
      setError(err.message || 'OTP không hợp lệ hoặc đã qua thời gian sử dụng.');
    } finally {
      setIsLoading(false);
    }
  }, [email, otp, role, login, navigate]);

  return {
    email, setEmail,
    otp, setOtp,
    role, setRole,
    step, setStep,
    isLoading,
    error,
    successMessage,
    countdown,
    handleCheckEmail,
    handleResendOtp,
    handleVerifyOtp
  };
}

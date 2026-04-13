import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import { authService } from '@/shared/services/authService';

export type Step = 'EMAIL' | 'OTP';

export function useAdminLoginViewModel() {
  const [step, setStep] = useState<Step>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { isAuthenticated, login } = useAdminStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!email.trim()) { setError('Vui lòng nhập địa chỉ email.'); return; }

    setIsLoading(true);
    try {
      await authService.sendOtp({ email, role: 'ADMIN' });
      setSuccessMsg(`Mã OTP đã được gửi đến ${email}`);
      setStep('OTP');
    } catch (err: any) {
      setError(err.message || 'Không thể gửi OTP. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!otp.trim() || otp.length < 4) { setError('Vui lòng nhập mã OTP hợp lệ.'); return; }

    setIsLoading(true);
    try {
      const res = await authService.verifyOtp({ email, otpCode: otp, role: 'ADMIN' });

      const payload = res.data;
      const token = payload?.token;
      const user = payload?.user;
      const role = (user?.role || '').toUpperCase();

      if (role !== 'ADMIN') {
        throw new Error('Tài khoản này không có quyền truy cập hệ thống quản trị.');
      }

      login(token, {
        id: user.id,
        email: user.email || '',
        fullName: user.fullName,
        role,
      });

      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetStep = () => {
    setStep('EMAIL');
    setError(null);
    setOtp('');
  };

  return {
    step,
    email,
    setEmail,
    otp,
    setOtp,
    isLoading,
    error,
    successMsg,
    handleSendOtp,
    handleVerifyOtp,
    resetStep
  };
}

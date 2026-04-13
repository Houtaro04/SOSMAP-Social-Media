import { apiPost } from '@/lib/api';
import { 
  SendOtpRequest, 
  VerifyOtpRequest, 
  AuthResponse 
} from '@/shared/entities/AuthEntity';

/**
 * Service xử lý giao tiếp API xác thực (OTP / Đăng nhập).
 */
export const authService = {

  /**
   * Bước 1.2: Yêu cầu gửi mã OTP vào email
   */
  async sendOtp(data: SendOtpRequest | Partial<SendOtpRequest>): Promise<{ success: boolean; message: string }> {
    const request = data instanceof SendOtpRequest ? data : new SendOtpRequest(data);
    const error = request.validate();
    if (error) throw new Error(error);

    try {
      const responseData = await apiPost<any>('/Auth/send-otp', request);
      return { success: true, message: responseData.message || 'Đã gửi mã xác thực tới email của bạn.' };
    } catch (error: any) {
      console.error('[AuthService] sendOtp Error:', error);
      throw error;
    }
  },

  /**
   * Bước 2: Xác nhận OTP và phản hồi AuthResponse
   */
  async verifyOtp(data: VerifyOtpRequest | Partial<VerifyOtpRequest>): Promise<AuthResponse> {
    const request = data instanceof VerifyOtpRequest ? data : new VerifyOtpRequest(data);
    const error = request.validate();
    if (error) throw new Error(error);

    try {
      const responseData = await apiPost<any>('/Auth/verify-otp', request);
      // Pass both root response and nested data if present to AuthResponse
      const auth = new AuthResponse(responseData);
      
      // Fallback: New backend versions might return data directly at top level or in nested .data
      // If success is missing but we're in the try block, assume true
      if (responseData.success === undefined) auth.success = true;
      
      return auth;
    } catch (error: any) {
      console.error('[AuthService] verifyOtp Error:', error);
      throw error;
    }
  }
};

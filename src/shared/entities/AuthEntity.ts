import type { UserRole } from "@/shared/types/UserRole";
import type { UserStatus } from "@/shared/types/UserStatus";

export class UserResponse {
  id: string = '';
  phone: string | null = null;
  email: string | null = null;
  fullName: string = '';
  role: UserRole = 'CITIZEN';
  status: string = '';
  imageUrl: string | null = null;
  address: string | null = null;
  latitude: number | null = null;
  longitude: number | null = null;
  createdAt: string = '';
  updatedAt: string = '';

  constructor(init?: Partial<UserResponse>) {
    if (init) {
      Object.assign(this, init);
    }
  }
}

export class AuthResponse {
  status: number = 200;
  message: string = '';
  success: boolean = false;
  data: {
    token: string;
    user: UserResponse;
  } = { token: '', user: new UserResponse() };

  constructor(init?: Partial<AuthResponse>) {
    if (init) {
      Object.assign(this, init);
      
      // If the backend returned data at the root (token and user directly on init)
      // and this.data is empty, we "lift" those fields into the data object.
      const raw = init as any;
      if (!this.data.token && raw.token) {
        this.data.token = raw.token;
      }
      if (raw.user) {
        this.data.user = new UserResponse(raw.user);
      } else if (this.data && this.data.user) {
        // Nested data case
        this.data.user = new UserResponse(this.data.user);
      }
    }
  }
}

export class SendOtpRequest {
  email: string = '';
  role: UserRole = 'CITIZEN';

  constructor(init?: Partial<SendOtpRequest>) {
    Object.assign(this, init);
  }

  validate(): string | null {
    if (!this.email || this.email.trim() === '') {
      return 'Email không được để trống.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      return 'Vui lòng nhập đúng định dạng email.';
    }
    return null;
  }
}

export class VerifyOtpRequest {
  email: string = '';
  otpCode: string = '';
  role: UserRole = 'CITIZEN';

  constructor(init?: Partial<VerifyOtpRequest>) {
    Object.assign(this, init);
  }

  validate(): string | null {
    if (!this.email || this.email.trim() === '') return 'Email không được để trống.';
    if (!this.otpCode || this.otpCode.trim() === '') return 'Mã OTP không được để trống.';
    if (this.otpCode.length < 4) return 'Mã OTP không hợp lệ.';
    return null;
  }
}


// Giữ lại AuthValidator như một tiện ích cho các trường hợp kiểm tra nhanh
export class AuthValidator {
  public static validateEmail(email: string): { isValid: boolean; error: string | null } {
    if (!email || email.trim() === '') {
      return { isValid: false, error: 'Email không được để trống.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Vui lòng nhập đúng định dạng email (ví dụ: name@agency.gov)' };
    }
    return { isValid: true, error: null };
  }

  public static validateOTP(otp: string): { isValid: boolean; error: string | null } {
    if (!otp || otp.trim() === '') {
      return { isValid: false, error: 'Mã OTP không được để trống.' };
    }
    if (otp.length < 4) {
      return { isValid: false, error: 'Mã OTP không hợp lệ.' };
    }
    return { isValid: true, error: null };
  }
}

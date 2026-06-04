import { describe, it, expect } from 'vitest';
import {
  SendOtpRequest,
  VerifyOtpRequest,
  AuthValidator,
  UserResponse,
  AuthResponse,
} from '../shared/entities/AuthEntity';

// =============================================================
// SendOtpRequest.validate()
// =============================================================
describe('SendOtpRequest – validate()', () => {
  it('trả về lỗi khi email rỗng', () => {
    const req = new SendOtpRequest({ email: '' });
    expect(req.validate()).toBe('Email không được để trống.');
  });

  it('trả về lỗi khi email chỉ có khoảng trắng', () => {
    const req = new SendOtpRequest({ email: '   ' });
    expect(req.validate()).toBe('Email không được để trống.');
  });

  it('trả về lỗi khi email sai định dạng (thiếu @)', () => {
    const req = new SendOtpRequest({ email: 'notanemail.com' });
    expect(req.validate()).toBe('Vui lòng nhập đúng định dạng email.');
  });

  it('trả về lỗi khi email sai định dạng (thiếu domain)', () => {
    const req = new SendOtpRequest({ email: 'user@' });
    expect(req.validate()).toBe('Vui lòng nhập đúng định dạng email.');
  });

  it('trả về null khi email hợp lệ', () => {
    const req = new SendOtpRequest({ email: 'user@example.com' });
    expect(req.validate()).toBeNull();
  });

  it('trả về null với email có subdomain', () => {
    const req = new SendOtpRequest({ email: 'admin@gov.vn' });
    expect(req.validate()).toBeNull();
  });

  it('role mặc định là CITIZEN', () => {
    const req = new SendOtpRequest({ email: 'a@b.com' });
    expect(req.role).toBe('CITIZEN');
  });

  it('role được gán từ init', () => {
    const req = new SendOtpRequest({ email: 'a@b.com', role: 'VOLUNTEER' });
    expect(req.role).toBe('VOLUNTEER');
  });
});

// =============================================================
// VerifyOtpRequest.validate()
// =============================================================
describe('VerifyOtpRequest – validate()', () => {
  it('trả về lỗi khi email rỗng', () => {
    const req = new VerifyOtpRequest({ email: '', otpCode: '1234' });
    expect(req.validate()).toBe('Email không được để trống.');
  });

  it('trả về lỗi khi otpCode rỗng', () => {
    const req = new VerifyOtpRequest({ email: 'a@b.com', otpCode: '' });
    expect(req.validate()).toBe('Mã OTP không được để trống.');
  });

  it('trả về lỗi khi otpCode chỉ khoảng trắng', () => {
    const req = new VerifyOtpRequest({ email: 'a@b.com', otpCode: '   ' });
    expect(req.validate()).toBe('Mã OTP không được để trống.');
  });

  it('trả về lỗi khi otpCode ngắn hơn 4 ký tự', () => {
    const req = new VerifyOtpRequest({ email: 'a@b.com', otpCode: '123' });
    expect(req.validate()).toBe('Mã OTP không hợp lệ.');
  });

  it('trả về null khi email + otpCode hợp lệ (4 chữ số)', () => {
    const req = new VerifyOtpRequest({ email: 'a@b.com', otpCode: '1234' });
    expect(req.validate()).toBeNull();
  });

  it('trả về null khi otpCode dài hơn 4 ký tự', () => {
    const req = new VerifyOtpRequest({ email: 'a@b.com', otpCode: '123456' });
    expect(req.validate()).toBeNull();
  });

  it('role mặc định là CITIZEN', () => {
    const req = new VerifyOtpRequest({});
    expect(req.role).toBe('CITIZEN');
  });
});

// =============================================================
// AuthValidator.validateEmail()
// =============================================================
describe('AuthValidator – validateEmail()', () => {
  it('invalid khi email rỗng', () => {
    const result = AuthValidator.validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email không được để trống.');
  });

  it('invalid khi chỉ có khoảng trắng', () => {
    const result = AuthValidator.validateEmail('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email không được để trống.');
  });

  it('invalid khi sai định dạng email', () => {
    const result = AuthValidator.validateEmail('badformat');
    expect(result.isValid).toBe(false);
    expect(result.error).not.toBeNull();
  });

  it('valid khi email đúng định dạng', () => {
    const result = AuthValidator.validateEmail('citizen@gmail.com');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('valid với email cơ quan nhà nước', () => {
    const result = AuthValidator.validateEmail('admin@pccc.gov.vn');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });
});

// =============================================================
// AuthValidator.validateOTP()
// =============================================================
describe('AuthValidator – validateOTP()', () => {
  it('invalid khi OTP rỗng', () => {
    const result = AuthValidator.validateOTP('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Mã OTP không được để trống.');
  });

  it('invalid khi OTP chỉ khoảng trắng', () => {
    const result = AuthValidator.validateOTP('  ');
    expect(result.isValid).toBe(false);
  });

  it('invalid khi OTP dưới 4 ký tự', () => {
    const result = AuthValidator.validateOTP('12');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Mã OTP không hợp lệ.');
  });

  it('valid khi OTP đúng 4 ký tự', () => {
    const result = AuthValidator.validateOTP('4321');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('valid khi OTP 6 ký tự', () => {
    const result = AuthValidator.validateOTP('654321');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });
});

// =============================================================
// UserResponse – constructor
// =============================================================
describe('UserResponse – constructor', () => {
  it('tạo instance với giá trị mặc định khi không có init', () => {
    const user = new UserResponse();
    expect(user.id).toBe('');
    expect(user.role).toBe('CITIZEN');
    expect(user.email).toBeNull();
  });

  it('gán đúng các trường từ init', () => {
    const user = new UserResponse({ id: 'u1', email: 'a@b.com', fullName: 'Nguyen Van A', role: 'VOLUNTEER' });
    expect(user.id).toBe('u1');
    expect(user.email).toBe('a@b.com');
    expect(user.fullName).toBe('Nguyen Van A');
    expect(user.role).toBe('VOLUNTEER');
  });
});

// =============================================================
// AuthResponse – constructor
// =============================================================
describe('AuthResponse – constructor', () => {
  it('tạo instance mặc định khi không có init', () => {
    const res = new AuthResponse();
    expect(res.success).toBe(false);
    expect(res.data.token).toBe('');
  });

  it('nhận dạng token và user từ dữ liệu dạng nested (data.token)', () => {
    const res = new AuthResponse({
      success: true,
      data: { token: 'abc123', user: { id: 'u1', fullName: 'A', role: 'CITIZEN' } as any },
    });
    expect(res.success).toBe(true);
    expect(res.data.token).toBe('abc123');
    expect(res.data.user.id).toBe('u1');
  });

  it('lift token từ root (flat format) khi data.token rỗng', () => {
    // Backend trả token và user ở root thay vì data
    const res = new AuthResponse({ token: 'flattoken', user: { id: 'u2' } } as any);
    expect(res.data.token).toBe('flattoken');
    expect(res.data.user.id).toBe('u2');
  });
});

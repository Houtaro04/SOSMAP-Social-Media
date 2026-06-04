import { describe, it, expect } from 'vitest';
import { ProfileUpdateRequest } from '../shared/entities/ProfileEntity';

// =============================================================
// ProfileUpdateRequest.validate()
// =============================================================
describe('ProfileUpdateRequest – validate()', () => {
  it('trả về lỗi khi fullName rỗng', () => {
    const req = new ProfileUpdateRequest({ fullName: '' });
    expect(req.validate()).toBe('Họ và tên không được để trống.');
  });

  it('trả về lỗi khi fullName chỉ khoảng trắng', () => {
    const req = new ProfileUpdateRequest({ fullName: '   ' });
    expect(req.validate()).toBe('Họ và tên không được để trống.');
  });

  it('trả về null khi fullName hợp lệ', () => {
    const req = new ProfileUpdateRequest({ fullName: 'Nguyễn Văn A' });
    expect(req.validate()).toBeNull();
  });

  it('trả về null khi fullName là một ký tự', () => {
    const req = new ProfileUpdateRequest({ fullName: 'A' });
    expect(req.validate()).toBeNull();
  });

  it('các trường tùy chọn không ảnh hưởng validate', () => {
    const req = new ProfileUpdateRequest({
      fullName: 'Trần Thị B',
      phone: '0912345678',
      email: 'b@example.com',
      idCard: '001234567890',
      address: 'Hà Nội',
    });
    expect(req.validate()).toBeNull();
  });

  it('giá trị mặc định khi không truyền init', () => {
    const req = new ProfileUpdateRequest();
    expect(req.fullName).toBe('');
    expect(req.phone).toBe('');
    expect(req.email).toBe('');
    expect(req.address).toBe('');
  });

  it('gán đúng giá trị từ init', () => {
    const req = new ProfileUpdateRequest({
      fullName: 'Le Van C',
      phone: '0987654321',
      imageUrl: 'https://cdn.example.com/avatar.png',
    });
    expect(req.fullName).toBe('Le Van C');
    expect(req.phone).toBe('0987654321');
    expect(req.imageUrl).toBe('https://cdn.example.com/avatar.png');
  });
});

// =============================================================
// ProfileResponse – constructor
// =============================================================
import { ProfileResponse } from '../shared/entities/ProfileEntity';

describe('ProfileResponse – constructor', () => {
  it('giá trị mặc định', () => {
    const p = new ProfileResponse();
    expect(p.id).toBe('');
    expect(p.role).toBe('CITIZEN');
    expect(p.status).toBe('ACTIVE');
  });

  it('gán đúng từ init', () => {
    const p = new ProfileResponse({
      id: 'user-1',
      fullName: 'Nguyễn Văn A',
      role: 'VOLUNTEER',
      status: 'PENDING',
      email: 'nva@gmail.com',
    });
    expect(p.id).toBe('user-1');
    expect(p.role).toBe('VOLUNTEER');
    expect(p.status).toBe('PENDING');
  });
});

// =============================================================
// SosStatsResponse – constructor
// =============================================================
import { SosStatsResponse } from '../shared/entities/ProfileEntity';

describe('SosStatsResponse – constructor', () => {
  it('giá trị mặc định là 0', () => {
    const s = new SosStatsResponse();
    expect(s.totalSent).toBe(0);
    expect(s.completed).toBe(0);
    expect(s.processing).toBe(0);
    expect(s.volunteerSuccessRate).toBe(0);
  });

  it('gán đúng từ init', () => {
    const s = new SosStatsResponse({ totalSent: 10, completed: 8, processing: 2, volunteerSuccessRate: 80 });
    expect(s.totalSent).toBe(10);
    expect(s.completed).toBe(8);
    expect(s.volunteerSuccessRate).toBe(80);
  });
});

import { describe, it, expect } from 'vitest';
import { SosCreateRequest, SosReportResponse } from '../shared/entities/SosEntity';

// =============================================================
// SosCreateRequest.validate()
// =============================================================
describe('SosCreateRequest – validate()', () => {
  it('trả về lỗi khi address rỗng', () => {
    const req = new SosCreateRequest({ address: '', details: 'Cần giúp đỡ' });
    expect(req.validate()).toBe('Vui lòng cung cấp địa chỉ cần cứu trợ!');
  });

  it('trả về lỗi khi address chỉ khoảng trắng', () => {
    const req = new SosCreateRequest({ address: '   ', details: 'Cần giúp đỡ' });
    expect(req.validate()).toBe('Vui lòng cung cấp địa chỉ cần cứu trợ!');
  });

  it('trả về lỗi khi details rỗng', () => {
    const req = new SosCreateRequest({ address: '123 Đường ABC', details: '' });
    expect(req.validate()).toBe('Vui lòng cung cấp mô tả tình trạng hiện tại!');
  });

  it('trả về lỗi khi details chỉ khoảng trắng', () => {
    const req = new SosCreateRequest({ address: '123 Đường ABC', details: '   ' });
    expect(req.validate()).toBe('Vui lòng cung cấp mô tả tình trạng hiện tại!');
  });

  it('trả về null khi tất cả trường hợp lệ', () => {
    const req = new SosCreateRequest({
      address: 'Số 1 Đại Cồ Việt, Hà Nội',
      details: 'Ngập lụt nghiêm trọng',
    });
    expect(req.validate()).toBeNull();
  });

  it('level mặc định là LOW', () => {
    const req = new SosCreateRequest({});
    expect(req.level).toBe('LOW');
  });

  it('level được gán đúng từ init', () => {
    const req = new SosCreateRequest({ level: 'URGENT' });
    expect(req.level).toBe('URGENT');
  });

  it('latitude/longitude là undefined khi không truyền', () => {
    const req = new SosCreateRequest({ address: 'abc', details: 'xyz' });
    expect(req.latitude).toBeUndefined();
    expect(req.longitude).toBeUndefined();
  });

  it('latitude/longitude được lưu đúng khi truyền vào', () => {
    const req = new SosCreateRequest({ address: 'abc', details: 'xyz', latitude: 21.05, longitude: 105.85 });
    expect(req.latitude).toBe(21.05);
    expect(req.longitude).toBe(105.85);
  });
});

// =============================================================
// SosReportResponse – constructor (camelCase & PascalCase)
// =============================================================
describe('SosReportResponse – constructor', () => {
  it('tạo instance mặc định khi không có init', () => {
    const res = new SosReportResponse();
    expect(res.id).toBe('');
    expect(res.status).toBe('PENDING');
    expect(res.level).toBe('LOW');
  });

  it('nhận đúng dữ liệu camelCase từ backend', () => {
    const res = new SosReportResponse({
      id: 'sos-1',
      userId: 'u1',
      address: '10 Hàng Bài',
      level: 'urgent',
      status: 'pending',
      details: 'Cần hỗ trợ ngay',
      latitude: 21.0285,
      longitude: 105.8542,
      fullName: 'Nguyen Van A',
      phoneNumber: '0912345678',
      createdAt: '2025-01-01T00:00:00Z',
    });
    expect(res.id).toBe('sos-1');
    expect(res.address).toBe('10 Hàng Bài');
    expect(res.status).toBe('PENDING');         // phải uppercase
    expect(res.level).toBe('urgent');
    expect(res.latitude).toBe(21.0285);
    expect(res.longitude).toBe(105.8542);
    expect(res.fullName).toBe('Nguyen Van A');
  });

  it('nhận đúng dữ liệu PascalCase (từ backend .NET)', () => {
    const res = new SosReportResponse({
      Id: 'sos-2',
      UserId: 'u2',
      Address: 'Số 2 Lê Lợi',
      Level: 'MEDICAL',
      Status: 'PROCESSING',
      Details: 'Cần xe cấp cứu',
      Latitude: '21.0300',    // dạng string (MySQL DECIMAL)
      Longitude: '105.8550',
      FullName: 'Tran Thi B',
      PhoneNumber: '0987654321',
      CreatedAt: '2025-02-01T00:00:00Z',
    });
    expect(res.id).toBe('sos-2');
    expect(res.address).toBe('Số 2 Lê Lợi');
    expect(res.status).toBe('PROCESSING');
    expect(res.latitude).toBeCloseTo(21.03);
    expect(res.longitude).toBeCloseTo(105.855);
  });

  it('ép kiểu latitude/longitude từ string sang number (MySQL DECIMAL)', () => {
    const res = new SosReportResponse({ latitude: '10.776530', longitude: '106.700981' });
    expect(typeof res.latitude).toBe('number');
    expect(typeof res.longitude).toBe('number');
    expect(res.latitude).toBeCloseTo(10.77653);
    expect(res.longitude).toBeCloseTo(106.700981);
  });

  it('latitude/longitude là undefined khi không có trong init', () => {
    const res = new SosReportResponse({ id: 'sos-3' });
    expect(res.latitude).toBeUndefined();
    expect(res.longitude).toBeUndefined();
  });

  it('status luôn được UPPERCASE', () => {
    const res = new SosReportResponse({ status: 'completed' });
    expect(res.status).toBe('COMPLETED');
  });

  it('status mặc định là PENDING khi không phải string', () => {
    const res = new SosReportResponse({ status: 123 });
    expect(res.status).toBe('PENDING');
  });
});

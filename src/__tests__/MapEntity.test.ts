import { describe, it, expect } from 'vitest';
import { SosReportResponse, SafetyPointResponse } from '../shared/entities/MapEntity';

// =============================================================
// SosReportResponse (MapEntity version)
// =============================================================
describe('MapEntity – SosReportResponse', () => {
  it('giá trị mặc định khi không truyền init', () => {
    const r = new SosReportResponse();
    expect(r.id).toBe('');
    expect(r.status).toBe('PENDING');
    expect(r.latitude).toBeNull();
    expect(r.longitude).toBeNull();
  });

  it('nhận camelCase từ backend Node/Spring', () => {
    const r = new SosReportResponse({
      id: 'map-sos-1',
      address: 'Đường Láng, HN',
      level: 'FLOOD',
      status: 'active',
      latitude: 21.03,
      longitude: 105.84,
    });
    expect(r.id).toBe('map-sos-1');
    expect(r.status).toBe('ACTIVE');
    expect(r.level).toBe('FLOOD');
    expect(r.latitude).toBeCloseTo(21.03);
  });

  it('nhận PascalCase từ backend .NET', () => {
    const r = new SosReportResponse({
      Id: 'map-sos-2',
      Address: 'Quận 1, HCM',
      Level: 'MEDICAL',
      Status: 'resolved',
      Latitude: '10.7769',
      Longitude: '106.7009',
    });
    expect(r.id).toBe('map-sos-2');
    expect(r.status).toBe('RESOLVED');
    expect(r.latitude).toBeCloseTo(10.7769);
    expect(r.longitude).toBeCloseTo(106.7009);
  });

  it('latitude/longitude là null khi không truyền', () => {
    const r = new SosReportResponse({ id: 'x' });
    expect(r.latitude).toBeNull();
    expect(r.longitude).toBeNull();
  });

  it('ép kiểu string DECIMAL thành number', () => {
    const r = new SosReportResponse({ latitude: '21.0285000', longitude: '105.8542000' });
    expect(typeof r.latitude).toBe('number');
    expect(r.latitude).toBeCloseTo(21.0285);
  });

  it('status luôn UPPERCASE', () => {
    expect(new SosReportResponse({ status: 'pending' }).status).toBe('PENDING');
    expect(new SosReportResponse({ status: 'Processing' }).status).toBe('PROCESSING');
    expect(new SosReportResponse({ status: 'COMPLETED' }).status).toBe('COMPLETED');
  });

  it('status fallback PENDING khi không phải string', () => {
    expect(new SosReportResponse({ status: null }).status).toBe('PENDING');
    expect(new SosReportResponse({ status: undefined }).status).toBe('PENDING');
  });
});

// =============================================================
// SafetyPointResponse (MapEntity)
// =============================================================
describe('MapEntity – SafetyPointResponse', () => {
  it('giá trị mặc định khi không truyền init', () => {
    const sp = new SafetyPointResponse();
    expect(sp.id).toBe('');
    expect(sp.name).toBe('');
    expect(sp.latitude).toBeNull();
    expect(sp.longitude).toBeNull();
    expect(sp.type).toBeNull();
    expect(sp.address).toBeNull();
  });

  it('nhận camelCase đúng', () => {
    const sp = new SafetyPointResponse({
      id: 'sp-1',
      name: 'Trường học An Toàn',
      type: 'SHELTER',
      address: 'Số 5 Trần Nhân Tông',
      description: 'Điểm trú ẩn',
      latitude: 21.02,
      longitude: 105.83,
      createdBy: 'volunteer-1',
    });
    expect(sp.id).toBe('sp-1');
    expect(sp.name).toBe('Trường học An Toàn');
    expect(sp.type).toBe('SHELTER');
    expect(sp.latitude).toBeCloseTo(21.02);
    expect(sp.createdBy).toBe('volunteer-1');
  });

  it('nhận PascalCase từ backend .NET', () => {
    const sp = new SafetyPointResponse({
      Id: 'sp-2',
      Name: 'Bệnh viện Bạch Mai',
      Type: 'HOSPITAL',
      Address: 'Giải Phóng, Hà Nội',
      Latitude: '21.0050',
      Longitude: '105.8406',
    });
    expect(sp.id).toBe('sp-2');
    expect(sp.name).toBe('Bệnh viện Bạch Mai');
    expect(sp.type).toBe('HOSPITAL');
    expect(sp.latitude).toBeCloseTo(21.005);
    expect(sp.longitude).toBeCloseTo(105.8406);
  });

  it('ép kiểu latitude/longitude từ string sang number', () => {
    const sp = new SafetyPointResponse({ latitude: '16.054400', longitude: '108.202200' });
    expect(typeof sp.latitude).toBe('number');
    expect(sp.latitude).toBeCloseTo(16.0544);
  });

  it('latitude/longitude null khi không truyền', () => {
    const sp = new SafetyPointResponse({ id: 'sp-3', name: 'Test' });
    expect(sp.latitude).toBeNull();
    expect(sp.longitude).toBeNull();
  });
});

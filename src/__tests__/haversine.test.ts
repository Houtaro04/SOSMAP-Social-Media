import { describe, it, expect } from 'vitest';

/**
 * Hàm Haversine được trích từ useVolunteerMapViewModel.ts
 * Test hoàn toàn độc lập, không phụ thuộc React/browser.
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// =============================================================
// Haversine Distance
// =============================================================
describe('calculateDistance – Haversine Formula', () => {
  it('khoảng cách từ 1 điểm đến chính nó bằng 0', () => {
    const d = calculateDistance(21.0285, 105.8542, 21.0285, 105.8542);
    expect(d).toBeCloseTo(0, 5);
  });

  it('khoảng cách giữa Hà Nội và TP.HCM xấp xỉ 1138 km', () => {
    // Hà Nội: 21.0285, 105.8542 | TP.HCM: 10.8231, 106.6297
    const d = calculateDistance(21.0285, 105.8542, 10.8231, 106.6297);
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1180);
  });

  it('khoảng cách giữa Hà Nội và Đà Nẵng xấp xỉ 606 km', () => {
    // Đà Nẵng: 16.0544, 108.2022
    const d = calculateDistance(21.0285, 105.8542, 16.0544, 108.2022);
    expect(d).toBeGreaterThan(580);
    expect(d).toBeLessThan(640);
  });

  it('đối xứng: d(A→B) === d(B→A)', () => {
    const dAB = calculateDistance(21.0285, 105.8542, 10.8231, 106.6297);
    const dBA = calculateDistance(10.8231, 106.6297, 21.0285, 105.8542);
    expect(dAB).toBeCloseTo(dBA, 8);
  });

  it('kết quả luôn >= 0', () => {
    const d = calculateDistance(0, 0, 90, 180);
    expect(d).toBeGreaterThanOrEqual(0);
  });

  it('khoảng cách 2 điểm gần nhau (< 1 km) trả về giá trị nhỏ', () => {
    // ~100m tại Hà Nội
    const d = calculateDistance(21.0285, 105.8542, 21.0294, 105.8542);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(1);
  });

  it('hướng Bắc-Nam: di chuyển 1 độ vĩ tuyến ≈ 111 km', () => {
    const d = calculateDistance(10.0, 106.0, 11.0, 106.0);
    expect(d).toBeCloseTo(111, 0); // ±0.5 km
  });

  it('hướng Đông-Tây: tại xích đạo 1 độ kinh tuyến ≈ 111 km', () => {
    const d = calculateDistance(0.0, 0.0, 0.0, 1.0);
    expect(d).toBeCloseTo(111.19, 0);
  });

  it('tọa độ cực: không bị NaN hay Infinity', () => {
    const d = calculateDistance(-90, 0, 90, 0);
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeCloseTo(20015, -1); // nửa chu vi Trái Đất ~20015 km
  });

  it('không trả về NaN với tọa độ hợp lệ', () => {
    const d = calculateDistance(21.028, 105.854, 16.054, 108.202);
    expect(Number.isNaN(d)).toBe(false);
  });
});

// =============================================================
// Helpers dùng trong ViewModel (distanceStr logic)
// =============================================================
describe('distanceStr formatting logic', () => {
  const formatDistance = (dist: number) => dist < 1 ? '<1km' : dist.toFixed(1) + 'km';

  it('< 1km hiển thị "<1km"', () => {
    expect(formatDistance(0.5)).toBe('<1km');
  });

  it('đúng 1km hiển thị "1.0km"', () => {
    expect(formatDistance(1)).toBe('1.0km');
  });

  it('1.567km hiển thị "1.6km"', () => {
    expect(formatDistance(1.567)).toBe('1.6km');
  });

  it('100km hiển thị "100.0km"', () => {
    expect(formatDistance(100)).toBe('100.0km');
  });
});

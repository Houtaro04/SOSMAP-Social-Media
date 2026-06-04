import { describe, it, expect } from 'vitest';

// =============================================================
// Clustering logic được trích ra từ VolunteerMapView (supercluster)
// Ở đây ta test pure logic: nhóm điểm trong bán kính, đếm cluster,
// lấy điểm đại diện, và kiểm tra edge-case.
// =============================================================

interface Point {
  id: string;
  lat: number;
  lng: number;
}

interface Cluster {
  centroidLat: number;
  centroidLng: number;
  points: Point[];
  count: number;
}

/**
 * Simple grid-based clustering: nhóm các điểm nằm trong cùng
 * ô lưới kích thước `cellSizeDeg` độ kinh/vĩ.
 */
function clusterPoints(points: Point[], cellSizeDeg: number): Cluster[] {
  const cellMap: Map<string, Point[]> = new Map();

  for (const p of points) {
    const row = Math.floor(p.lat / cellSizeDeg);
    const col = Math.floor(p.lng / cellSizeDeg);
    const key = `${row}_${col}`;
    if (!cellMap.has(key)) cellMap.set(key, []);
    cellMap.get(key)!.push(p);
  }

  const clusters: Cluster[] = [];
  for (const pts of cellMap.values()) {
    const centroidLat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
    const centroidLng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
    clusters.push({ centroidLat, centroidLng, points: pts, count: pts.length });
  }
  return clusters;
}

/**
 * Lọc các cluster có count >= minCount
 */
function filterClusters(clusters: Cluster[], minCount: number): Cluster[] {
  return clusters.filter(c => c.count >= minCount);
}

/**
 * Tìm cluster gần nhất với một tọa độ
 */
function findNearestCluster(clusters: Cluster[], lat: number, lng: number): Cluster | null {
  if (clusters.length === 0) return null;
  return clusters.reduce((nearest, c) => {
    const dNearest = Math.hypot(nearest.centroidLat - lat, nearest.centroidLng - lng);
    const dCurrent = Math.hypot(c.centroidLat - lat, c.centroidLng - lng);
    return dCurrent < dNearest ? c : nearest;
  });
}

// =============================================================
// Tests
// =============================================================
describe('clusterPoints – basic clustering', () => {
  it('không có điểm → không có cluster', () => {
    const result = clusterPoints([], 0.1);
    expect(result).toHaveLength(0);
  });

  it('1 điểm → 1 cluster với count = 1', () => {
    const pts: Point[] = [{ id: 'a', lat: 21.02, lng: 105.85 }];
    const result = clusterPoints(pts, 0.1);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(1);
  });

  it('2 điểm rất gần nhau → cùng 1 cluster', () => {
    const pts: Point[] = [
      { id: 'a', lat: 21.0285, lng: 105.8542 },
      { id: 'b', lat: 21.0290, lng: 105.8548 },
    ];
    const result = clusterPoints(pts, 0.1); // cell = 0.1°
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
    expect(result[0].points).toHaveLength(2);
  });

  it('2 điểm xa nhau → 2 cluster riêng biệt', () => {
    const pts: Point[] = [
      { id: 'hanoi', lat: 21.0285, lng: 105.8542 },
      { id: 'hcm', lat: 10.8231, lng: 106.6297 },
    ];
    const result = clusterPoints(pts, 0.5);
    expect(result).toHaveLength(2);
  });

  it('centroid được tính đúng (trung bình tọa độ)', () => {
    const pts: Point[] = [
      { id: 'a', lat: 21.0, lng: 105.0 },
      { id: 'b', lat: 21.2, lng: 105.2 },
    ];
    const result = clusterPoints(pts, 1.0); // cùng ô vì 21.0 và 21.2 → floor(21.0/1) = 21
    expect(result).toHaveLength(1);
    expect(result[0].centroidLat).toBeCloseTo(21.1, 5);
    expect(result[0].centroidLng).toBeCloseTo(105.1, 5);
  });

  it('5 điểm chia thành 2 cluster (3+2)', () => {
    const pts: Point[] = [
      // Cluster 1 (~Hà Nội, cell 0.5° → 21.0-21.5, 105.5-106.0)
      { id: 'a1', lat: 21.02, lng: 105.85 },
      { id: 'a2', lat: 21.10, lng: 105.90 },
      { id: 'a3', lat: 21.20, lng: 105.80 },
      // Cluster 2 (~Đà Nẵng, cell 0.5° → 16.0-16.5, 108.0-108.5)
      { id: 'b1', lat: 16.05, lng: 108.20 },
      { id: 'b2', lat: 16.08, lng: 108.22 },
    ];
    const result = clusterPoints(pts, 0.5);
    expect(result).toHaveLength(2);
    const counts = result.map(c => c.count).sort((a, b) => a - b);
    expect(counts).toEqual([2, 3]);
  });

  it('tất cả điểm trong cùng cell → 1 cluster với đúng count', () => {
    const pts: Point[] = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      lat: 21.0 + i * 0.001,
      lng: 105.0 + i * 0.001,
    }));
    const result = clusterPoints(pts, 1.0);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(10);
  });
});

// =============================================================
// filterClusters
// =============================================================
describe('filterClusters', () => {
  const sampleClusters: Cluster[] = [
    { centroidLat: 21.0, centroidLng: 105.0, points: [], count: 1 },
    { centroidLat: 16.0, centroidLng: 108.0, points: [], count: 5 },
    { centroidLat: 10.0, centroidLng: 106.0, points: [], count: 10 },
  ];

  it('minCount = 1 → giữ tất cả', () => {
    expect(filterClusters(sampleClusters, 1)).toHaveLength(3);
  });

  it('minCount = 5 → lọc đúng', () => {
    const result = filterClusters(sampleClusters, 5);
    expect(result).toHaveLength(2);
    expect(result.every(c => c.count >= 5)).toBe(true);
  });

  it('minCount = 11 → không còn cluster nào', () => {
    expect(filterClusters(sampleClusters, 11)).toHaveLength(0);
  });

  it('input rỗng → output rỗng', () => {
    expect(filterClusters([], 1)).toHaveLength(0);
  });
});

// =============================================================
// findNearestCluster
// =============================================================
describe('findNearestCluster', () => {
  const clusters: Cluster[] = [
    { centroidLat: 21.0, centroidLng: 105.0, points: [], count: 3 }, // Hà Nội
    { centroidLat: 16.0, centroidLng: 108.0, points: [], count: 2 }, // Đà Nẵng
    { centroidLat: 10.8, centroidLng: 106.6, points: [], count: 5 }, // TP.HCM
  ];

  it('trả về null khi không có cluster', () => {
    expect(findNearestCluster([], 21.0, 105.0)).toBeNull();
  });

  it('tìm đúng cluster gần nhất với điểm query', () => {
    // Query gần Hà Nội
    const nearest = findNearestCluster(clusters, 21.1, 105.1);
    expect(nearest).not.toBeNull();
    expect(nearest!.centroidLat).toBe(21.0);
  });

  it('tìm đúng khi query gần TP.HCM', () => {
    const nearest = findNearestCluster(clusters, 10.9, 106.7);
    expect(nearest!.centroidLat).toBe(10.8);
  });

  it('với 1 cluster duy nhất thì luôn trả về cluster đó', () => {
    const single = [{ centroidLat: 0, centroidLng: 0, points: [], count: 1 }];
    expect(findNearestCluster(single, 99, 99)).toBe(single[0]);
  });
});

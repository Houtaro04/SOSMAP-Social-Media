export type { MapFilterType } from "@/shared/types/MapFilterType";

export class SosReportResponse {
  id: string = '';
  userId: string = '';
  address: string = '';
  level: string = 'URGENT';
  status: string = 'PENDING';
  details: string = '';
  latitude: number | null = null;
  longitude: number | null = null;
  createdAt: string = '';
  updatedAt: string = '';

  constructor(init?: any) {
    if (init) {
      this.id = init.id || init.Id || this.id;
      this.userId = init.userId || init.UserId || this.userId;
      this.address = init.address || init.Address || this.address;
      this.level = init.level || init.Level || this.level;
      let rawStatus = init.status || init.Status || this.status;
      this.status = typeof rawStatus === 'string' ? rawStatus.toUpperCase() : 'PENDING';
      this.details = init.details || init.Details || this.details;
      // MySQL DECIMAL được trả về dạng string, ép kiểu sang number
      const rawLat = init.latitude ?? init.Latitude;
      const rawLng = init.longitude ?? init.Longitude;
      this.latitude = rawLat != null ? parseFloat(String(rawLat)) : null;
      this.longitude = rawLng != null ? parseFloat(String(rawLng)) : null;
      this.createdAt = init.createdAt || init.CreatedAt || this.createdAt;
      this.updatedAt = init.updatedAt || init.UpdatedAt || this.updatedAt;
    }
  }
}

export class SafetyPointResponse {
  id: string = '';
  name: string = '';
  type: string | null = null;
  address: string | null = null;
  description: string | null = null;
  latitude: number | null = null;
  longitude: number | null = null;
  createdBy: string | null = null;
  createdAt: string = '';
  updatedAt: string = '';

  constructor(init?: Partial<SafetyPointResponse>) {
    if (init) Object.assign(this, init);
  }
}



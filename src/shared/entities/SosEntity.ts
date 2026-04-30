export class SosCreateRequest {
  fullName: string = '';
  phoneNumber: string = '';
  address: string = '';
  details: string = '';

  latitude?: number;
  longitude?: number;
  level: string = 'LOW';

  constructor(init?: Partial<SosCreateRequest>) {
    if (init) {
      Object.assign(this, init);
    }
  }

  validate(): string | null {
    if (!this.address?.trim()) {
      return 'Vui lòng cung cấp địa chỉ cần cứu trợ!';
    }
    if (!this.details?.trim()) {
      return 'Vui lòng cung cấp mô tả tình trạng hiện tại!';
    }
    return null;
  }
}

export class SosReportResponse {
  id: string = '';
  userId: string = '';
  address: string = '';
  level: string = 'LOW';
  status: string = 'PENDING';
  details?: string = '';
  latitude?: number;
  longitude?: number;
  fullName?: string = '';
  phoneNumber?: string = '';
  createdAt: string = '';

  constructor(init?: any) {
    if (init) {
      this.id = init.id || init.Id || this.id;
      this.userId = init.userId || init.UserId || this.userId;
      this.address = init.address || init.Address || this.address;
      this.level = init.level || init.Level || this.level;
      let rawStatus = init.status || init.Status || this.status;
      this.status = typeof rawStatus === 'string' ? rawStatus.toUpperCase() : 'PENDING';
      this.details = init.details || init.Details || this.details;
      // MySQL DECIMAL thường bị trả về dạng string qua JSON, cần ép kiểu sang number
      const rawLat = init.latitude ?? init.Latitude;
      const rawLng = init.longitude ?? init.Longitude;
      this.latitude = rawLat != null ? parseFloat(String(rawLat)) : undefined;
      this.longitude = rawLng != null ? parseFloat(String(rawLng)) : undefined;
      this.fullName = init.fullName || init.FullName || this.fullName;
      this.phoneNumber = init.phoneNumber || init.PhoneNumber || this.phoneNumber;
      this.createdAt = init.createdAt || init.CreatedAt || this.createdAt;
    }
  }
}

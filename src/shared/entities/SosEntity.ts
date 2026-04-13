export class SosCreateRequest {
  fullName: string = '';
  phoneNumber: string = '';
  address: string = '';
  details: string = '';
  images?: File[] = [];
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
  createdAt: string = '';

  constructor(init?: Partial<SosReportResponse>) {
    if (init) Object.assign(this, init);
  }
}

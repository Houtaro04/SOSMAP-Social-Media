import type { SosRequestStatus } from "@/shared/types/SosRequestStatus";

export class ProfileResponse {
  id: string = '';
  fullName: string = '';
  phone?: string = '';
  idCard?: string = '';
  address?: string = '';
  imageUrl?: string = '';
  role: string = 'CITIZEN';
  email?: string = '';

  constructor(init?: Partial<ProfileResponse>) {
    if (init) Object.assign(this, init);
  }
}

export class ProfileUpdateRequest {
  fullName: string = '';
  phone?: string = '';
  email?: string = '';
  idCard?: string = '';
  address?: string = ''; // Tương đương Địa chỉ thường trú hoặc Khu vực hoạt động
  imageUrl?: string = '';

  constructor(init?: Partial<ProfileUpdateRequest>) {
    if (init) Object.assign(this, init);
  }

  validate(): string | null {
    if (!this.fullName || this.fullName.trim() === '') {
      return 'Họ và tên không được để trống.';
    }
    return null;
  }
}

export class SosStatsResponse {
  totalSent: number = 0;
  completed: number = 0;
  processing: number = 0;
  volunteerSuccessRate: number = 0; // Thêm trường này cho tình nguyện viên

  constructor(init?: Partial<SosStatsResponse>) {
    if (init) Object.assign(this, init);
  }
}

export class SosHistoryItemResponse {
  id: string = '';
  title: string = '';
  address: string = '';
  timeLine: string = ''; // "1 ngày trước"
  status: SosRequestStatus = 'DONE';
  type: 'FOOD' | 'WATER' | 'MEDICAL' = 'FOOD'; // Để hiển thị Icon

  constructor(init?: Partial<SosHistoryItemResponse>) {
    if (init) Object.assign(this, init);
  }
}


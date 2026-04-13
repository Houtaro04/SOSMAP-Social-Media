import type { MapFilterType } from "@/shared/types/MapFilterType";

export class SosReportResponse {
  id: string = '';
  userId: string = '';
  address: string = '';
  level: string | null = null;
  status: string = '';
  details: string | null = null;
  latitude: number | null = null;
  longitude: number | null = null;
  createdAt: string = '';
  updatedAt: string = '';

  constructor(init?: Partial<SosReportResponse>) {
    if (init) Object.assign(this, init);
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



import type { VolunteerStatus } from "@/shared/types/VolunteerStatus";

export class VolunteerResponse {
  id: string = '';
  name: string = ''; // Tên đội (VD: Đội Alpha - Khu vực 1)
  status: VolunteerStatus = 'OFFLINE'; // Trạng thái hoạt động
  regions: string[] = []; // Danh sách khu vực (VD: Quận 1, Quận 3)
  skills: string[] = []; // Các kỹ năng (VD: Y tế, Vận chuyển)
  avatarUrl?: string | null = null;
  phone?: string | null = null;

  constructor(init?: Partial<VolunteerResponse>) {
    if (init) Object.assign(this, init);
  }
}

export class VolunteerStats {
  totalMissions: number = 0;
  successMissions: number = 0;
  avgRating: number = 0;
  totalHours: number = 0;
  weeklyCompleted: number = 0;
  weeklyHelped: number = 0;
  weeklyRating: number = 0;

  constructor(init?: Partial<VolunteerStats>) {
    if (init) Object.assign(this, init);
  }
}

export class MissionHistory {
  id: string = '';
  title: string = '';
  type: 'URGENT' | 'MEDICAL' | 'FOOD' | 'EVACUATION' = 'FOOD';
  location: string = '';
  date: string = '';
  status: 'COMPLETED' | 'PROCESSING' = 'PROCESSING';
  rating?: number;

  constructor(init?: Partial<MissionHistory>) {
    if (init) Object.assign(this, init);
  }
}

export class Badge {
  id: string = '';
  name: string = '';
  icon: string = '';
  description: string = '';
  earned: boolean = false;

  constructor(init?: Partial<Badge>) {
    if (init) Object.assign(this, init);
  }
}


export class RescueTaskEntity {
  id: string = '';
  reportId: string = '';
  userId: string = '';
  status: string = 'IN_PROGRESS';
  note?: string = '';
  createdAt: string = '';

  constructor(init?: any) {
    if (init) {
      this.id = init.id || init.Id || this.id;
      this.reportId = init.reportId || init.ReportId || this.reportId;
      this.userId = init.userId || init.UserId || this.userId;
      this.status = (init.status || init.Status || this.status).toUpperCase();
      this.note = init.note || init.Note || this.note;
      this.createdAt = init.createdAt || init.CreatedAt || this.createdAt;
      this.updatedAt = init.updatedAt || init.UpdatedAt || this.updatedAt;
    }
  }
  updatedAt: string = '';
}

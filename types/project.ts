export interface ProjectMember {
  member_id: string;
  member_name: string;
  section: string;
  slides: string;
  task_title: string;
  status: string;
  progress: number;
  notes: string;
  due_date: string;
  display_order: number;
}

export interface ProjectDataResponse {
  members: ProjectMember[];
}

export interface ProjectDataErrorResponse {
  error: string;
}

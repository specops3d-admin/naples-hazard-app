export interface TimelineItem {
  phase: string;
  target_day: string;
  owner: string;
  action: string;
  required_output: string;
  depends_on: string;
  approval_handoff: string;
  status: string;
}

export interface TimelineDataResponse {
  timeline: TimelineItem[];
}

export interface TimelineDataErrorResponse {
  error: string;
}

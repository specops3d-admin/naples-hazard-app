export interface ChecklistItem {
  category: string;
  checklist_item: string;
  owner: string;
  evidence_slides: string;
  status: string;
  notes_fix_needed: string;
}

export interface ChecklistDataResponse {
  checklist: ChecklistItem[];
}

export interface ChecklistDataErrorResponse {
  error: string;
}

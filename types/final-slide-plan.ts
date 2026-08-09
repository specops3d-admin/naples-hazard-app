export interface FinalSlidePlanItem {
  final_number: number;
  slide_title: string;
  owner: string;
  required_content_takeaway: string;
  suggested_visual: string;
  existing_draft_slides: string;
  citation_source_check: string;
  status: string;
}

export interface FinalSlidePlanDataResponse {
  slides: FinalSlidePlanItem[];
}

export interface FinalSlidePlanDataErrorResponse {
  error: string;
}

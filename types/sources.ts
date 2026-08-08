export interface SourceItem {
  section: string;
  source_organization: string;
  primary_use: string;
  url: string;
  assigned_to: string;
  verification_status: string;
  notes_image_credit: string;
}

export interface SourcesDataResponse {
  sources: SourceItem[];
}

export interface SourcesDataErrorResponse {
  error: string;
}

export type AssignmentStatus =
  | "Not Started"
  | "Needs Revision"
  | "In Progress"
  | "Ready for Review"
  | "Complete"
  | string;

export interface AssignmentRow {
  id: string;
  external_key: string;
  assignee_email: string;
  display_name: string;
  section: string;
  slides: string;
  task_title: string;
  status: AssignmentStatus;
  notes: string | null;
  progress: number;
  due_date: string | null;
  updated_at: string;
  created_at: string;
}

export type ProjectMemberRole = "member" | "project_lead";

export interface ProjectMemberRow {
  email: string;
  role: ProjectMemberRole;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      assignments: {
        Row: AssignmentRow;
        Insert: {
          external_key: string;
          assignee_email: string;
          display_name: string;
          section: string;
          slides: string;
          task_title: string;
          status?: AssignmentStatus;
          notes?: string | null;
          progress?: number;
          due_date?: string | null;
        };
        Update: {
          external_key?: string;
          assignee_email?: string;
          display_name?: string;
          section?: string;
          slides?: string;
          task_title?: string;
          status?: AssignmentStatus;
          notes?: string | null;
          progress?: number;
          due_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: ProjectMemberRow;
        Insert: ProjectMemberRow;
        Update: Partial<ProjectMemberRow>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      update_my_assignment: {
        Args: {
          p_external_key: string;
          p_display_name: string;
          p_status: string;
          p_notes: string | null;
        };
        Returns: AssignmentRow;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type WorkflowStatus =
  | "Not Started"
  | "Needs Revision"
  | "In Progress"
  | "Ready for Review"
  | "Complete"
  | string;

export interface WorkflowMember {
  member: string;
  naplesSection: string;
  finalSlides: string;
  status: WorkflowStatus;
  progress: number;
  primaryHandoff: string;
}

export interface TaskAssignment {
  member: string;
  section: string;
  finalSlides: string;
  draftSlidesToReuse: string;
  requiredContent: string;
  visualsRequired: string;
  deliverable: string;
  dependenciesHandoff: string;
  status: WorkflowStatus;
  priority: string;
  progress: number;
  actualDueDate: string;
  memberFileNotesLink: string;
}

export interface FinalSlide {
  finalNumber: number;
  slideTitle: string;
  owner: string;
  requiredContentTakeaway: string;
  suggestedVisual: string;
  existingDraftSlides: string;
  citationSourceCheck: string;
  status: WorkflowStatus;
  progress: number;
}

export interface TimelinePhase {
  phase: string;
  targetDay: string;
  owner: string;
  action: string;
  requiredOutput: string;
  dependsOn: string;
  approvalHandoff: string;
  status: WorkflowStatus;
  progress: number;
}

export interface ChecklistItem {
  category: string;
  checklistItem: string;
  owner: string;
  evidenceSlides: string;
  status: WorkflowStatus;
  progress: number;
  notesFixNeeded: string;
}

export interface SourceRecord {
  section: string;
  sourceOrganization: string;
  primaryUse: string;
  url: string;
  assignedTo: string;
  verificationStatus: WorkflowStatus;
  progress: number;
  notesImageCredit: string;
}

export interface WorkflowData {
  meta: {
    importedAt: string;
    sourceFile: string;
    sheets: string[];
    progressNote: string;
  };
  teamDashboard: {
    title: string;
    subtitle: string;
    projectSummary: {
      assignedCity: string;
      audience: string;
      finalProduct: string;
      targetLength: string;
      bigQuestion: string;
      decisionQuestion: string;
    };
    progressSummary: {
      teamMembers: number;
      contentSlides: number;
      assignmentsComplete: number;
      assignmentsInProgress: number;
      readyForReview: number;
      needsRevision?: number;
      notStarted: number;
      overallCompletion: number;
    };
    members: WorkflowMember[];
    teamWorkingRules: string[];
  };
  taskAssignments: {
    title: string;
    assignments: TaskAssignment[];
  };
  finalSlidePlan: {
    title: string;
    slides: FinalSlide[];
  };
  timelineAndHandoffs: {
    title: string;
    phases: TimelinePhase[];
  };
  mergeChecklist: {
    title: string;
    items: ChecklistItem[];
  };
  sourceTracker: {
    title: string;
    sources: SourceRecord[];
    verificationNote: string;
  };
}

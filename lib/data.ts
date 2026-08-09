import workflowJson from "@/src/data/workflow.json";
import presentationJson from "@/src/data/presentation.json";
import type { WorkflowData } from "@/types/workflow";
import type { PresentationData } from "@/types/presentation";
import {
  averageProgressFromStatuses,
  countByStatus,
  overallCompletionFromMembers,
} from "@/lib/status";

export function getWorkflow(): WorkflowData {
  return workflowJson as WorkflowData;
}

export function getPresentation(): PresentationData {
  return presentationJson as PresentationData;
}

export function getOverallCompletion(workflow: WorkflowData = getWorkflow()) {
  const members = workflow.teamDashboard.members;
  const memberStatuses = members.map((m) => m.status);
  const assignmentStatuses = workflow.taskAssignments.assignments.map(
    (a) => a.status,
  );
  const slideStatuses = workflow.finalSlidePlan.slides.map((s) => s.status);
  const timelineStatuses = workflow.timelineAndHandoffs.phases.map((p) => p.status);
  const checklistStatuses = workflow.mergeChecklist.items.map((i) => i.status);
  const sourceStatuses = workflow.sourceTracker.sources.map(
    (s) => s.verificationStatus,
  );

  // Overall completion is the average of the five member progress values only.
  const overall = overallCompletionFromMembers(members);

  return {
    overall,
    members: averageProgressFromStatuses(memberStatuses),
    assignments: averageProgressFromStatuses(assignmentStatuses),
    slides: averageProgressFromStatuses(slideStatuses),
    timeline: averageProgressFromStatuses(timelineStatuses),
    checklist: averageProgressFromStatuses(checklistStatuses),
    sources: averageProgressFromStatuses(sourceStatuses),
    counts: {
      members: countByStatus(memberStatuses),
      assignments: countByStatus(assignmentStatuses),
      slides: countByStatus(slideStatuses),
    },
  };
}

export function getPriorityHazards(presentation: PresentationData = getPresentation()) {
  const rankingSlide = presentation.slides.find((s) =>
    s.title.toLowerCase().includes("top four hazards"),
  );
  const methodSlide = presentation.slides.find((s) =>
    s.title.toLowerCase().includes("hazard-ranking method"),
  );

  const blocks = rankingSlide?.textBlocks ?? [];
  const hazardNames = [
    "Campi Flegrei eruption / bradyseism",
    "Major earthquake",
    "Vesuvius eruption / ashfall",
    "Climate flood, heat & drought",
  ].filter((name) => blocks.includes(name));

  return hazardNames.map((name, index) => {
    const start = blocks.findIndex((b) => b === name);
    return {
      rank: index + 1,
      name,
      // Final-deck layout: science basis, human impact, economic interruption.
      peopleAffected: start >= 0 ? blocks[start + 2] ?? "" : "",
      killedInjured: start >= 0 ? blocks[start + 2] ?? "" : "",
      displaced: start >= 0 ? blocks[start + 3] ?? "" : "",
      whyCritical: start >= 0 ? blocks[start + 1] ?? "" : "",
      estimateNote: rankingSlide?.subtitle ?? "",
      sourceNote: rankingSlide?.sourceOrCitationText ?? "",
      priorityOrder:
        methodSlide?.textBlocks.find((block) =>
          block.toLowerCase().includes("priority score"),
        ) ?? "",
      slideNumber: rankingSlide?.slideNumber ?? 0,
    };
  });
}

export function getHazardSections(presentation: PresentationData = getPresentation()) {
  const bySection = (section: string) =>
    presentation.slides.filter((slide) => slide.section === section);

  const partIII = bySection("Part III — Volcanoes and Climate Change");

  return [
    {
      id: "tectonics",
      title: "Plate tectonics",
      sectionLabel: "Part I — Plate Tectonics",
      slides: bySection("Part I — Plate Tectonics").filter(
        (s) => s.slideNumber >= 2 && s.slideNumber <= 6,
      ),
    },
    {
      id: "earthquakes",
      title: "Earthquakes",
      sectionLabel: "Part II — Earthquakes",
      slides: bySection("Part II — Earthquakes").filter(
        (s) => s.slideNumber >= 8 && s.slideNumber <= 13,
      ),
    },
    {
      id: "volcanoes",
      title: "Volcanoes",
      sectionLabel: "Part III — Volcanoes and Climate Change",
      slides: partIII.filter((s) => s.slideNumber >= 16 && s.slideNumber <= 21),
    },
    {
      id: "climate",
      title: "Climate change",
      sectionLabel: "Part III — Volcanoes and Climate Change",
      slides: partIII.filter((s) => s.slideNumber >= 22 && s.slideNumber <= 23),
    },
    {
      id: "prioritization",
      title: "Hazard prioritization and mitigation",
      sectionLabel: "Part IV — Prioritization and Mitigation",
      slides: bySection("Part IV — Prioritization and Mitigation"),
    },
  ];
}

export { progressFromStatus } from "@/lib/status";

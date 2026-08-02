export interface PresentationSlide {
  slideNumber: number;
  title: string;
  subtitle?: string;
  textBlocks: string[];
  imagePath: string;
  section: string;
  sourceOrCitationText?: string;
}

export interface PresentationData {
  meta: {
    extractedAt: string;
    sourceFile: string;
    slideCount: number;
    note: string;
  };
  slides: PresentationSlide[];
}

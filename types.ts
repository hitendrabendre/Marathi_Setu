
export interface ProcessingResult {
  originalText: string;
  marathiTranslation: string;
  marathiExplanation: string;
}

export interface AudioState {
  isPlaying: boolean;
  progress: number;
  duration: number;
}

export interface DiaryAnalysisResult {
  summary: string;
  reply: string;
  primaryEmotion: string;
  keywords: string[];
  concerns: string[];
  needs: string[];
}

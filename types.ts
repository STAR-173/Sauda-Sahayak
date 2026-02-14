export interface NegotiationAnalysis {
  detected_tactic: string;
  secondary_tactic: string | null;
  risk_level: "Low" | "Medium" | "High";
  confidence_score: number;
  pressure_index: number;
  fairness_index: number;
  information_asymmetry_score: number;
  language_detected: string;
  insight: string;
  recommended_counter: string;
  leverage_shift_strategy: string;
  short_response_script: string;
  cultural_context_note: string;
  disclaimer: string;
}

export interface ChartDataPoint {
  subject: string;
  A: number;
  fullMark: number;
}

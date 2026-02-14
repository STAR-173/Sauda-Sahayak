export interface NegotiationAnalysis {
  detected_tactic: string;
  secondary_tactic: string | null;
  scam_type: string;
  risk_level: "Low" | "Medium" | "High";
  confidence_score: number;
  pressure_index: number;
  fairness_index: number;
  information_asymmetry_score: number;
  fair_price_estimate: string;
  driver_ask_price: string;
  language_detected: string;
  insight: string;
  recommended_counter: string;
  leverage_shift_strategy: string;
  short_response_script: string;
  cultural_context_note: string;
  disclaimer: string;
}

export interface VisionAnalysis {
  status: "FAKE_DETECTED" | "LEGITIMATE" | "INCONCLUSIVE";
  confidence: number;
  app_identified: string;
  evidence: string[];
  price_shown: string;
  price_assessment: string;
  recommended_action: string;
  forensic_details: string;
}

export interface GamificationResult {
  savings_amount: number;
  xp_earned: number;
  badge: string;
  badge_emoji: string;
  headline: string;
  savings_equivalent: string;
  share_text: string;
  encouragement: string;
}

export interface ChartDataPoint {
  subject: string;
  A: number;
  fullMark: number;
}

export type LocalMode = "rowdy" | "polite";
export type AppMode = "negotiate" | "scan" | "live";

export type Severity = "low" | "medium" | "high";
export type RecommendationType = "buy" | "sell" | "hold";
export type Urgency = "low" | "medium" | "high";
export type Trend = "up" | "down";

export interface KPICardData {
  title: string;
  value: string;
  change: string;
  trend: Trend;
  description: string;
  icon: string;
  color: string;
}

export interface RiskAlert {
  id: number;
  severity: Severity;
  commodity: string;
  region: string;
  priceChange: number;
  reason: string;
  timestamp: string;
  affectedMandis: number;
}

export interface AIRecommendation {
  id: number;
  type: RecommendationType;
  commodity: string;
  message: string;
  urgency: Urgency;
  expectedGain: string;
  confidence: number;
}

export interface AIInsight {
  id: number;
  commodity: string;
  region: string;
  demandTrend: string;
  demandScore: number;
  supplyTrend: string;
  supplyScore: number;
  opportunityScore: number;
  riskScore: number;
  insight: string;
  recommendation: string;
  priceTarget: string;
  horizon: string;
  tags: string[];
}

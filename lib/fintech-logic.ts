export interface CreditAdjustmentResult {
  newRate: number; // decimal rate, e.g. 0.0525 = 5.25%
  rateAdjustment: number; // decimal delta, e.g. -0.0025 = -25 bps
  annualInterestPayment: number; // dollars per year at adjusted rate
  financialImpact: number; // delta vs base annual interest (dollars)
  loanAmount?: number;
  baseRate?: number;
  impactText?: string;
  riskScore?: number;
}

export interface CovenantStatus {
  status: 'BREACH' | 'COMPLIANT';
  threshold: number;
  actual: number;
  timestamp: string;
}

/**
 * Hackathon logic (force red demo):
 * - riskScore <= 0.25 => -25 bps
 * - riskScore > 0.35  => +150 bps
 * - else              => 0 bps
 *
 * Returns numeric fields for UI formatting (no string numbers to avoid NaN).
 */
export const calculateCreditAdjustment = (
  riskScore: number,
  loanAmount: number,
  baseRate: number,
): CreditAdjustmentResult => {
  const LOW_RISK_THRESHOLD = 0.25; // discount below this
  const HIGH_RISK_THRESHOLD = 0.35; // penalty above this
  const GREEN_DISCOUNT = 0.0025; // 25 bps
  const HIGH_RISK_PENALTY = 0.015; // 150 bps

  const score = Number.isFinite(riskScore) ? riskScore : 0;
  const principal = Number.isFinite(loanAmount) ? loanAmount : 0;
  const base = Number.isFinite(baseRate) ? baseRate : 0;

  let adjustment = 0;
  let impactText = "Standard terms maintained.";

  if (score <= LOW_RISK_THRESHOLD) {
    adjustment = -GREEN_DISCOUNT;
    impactText = `Green Discount Applied (-${(GREEN_DISCOUNT * 100).toFixed(2)}%).`;
  } else if (score > HIGH_RISK_THRESHOLD) {
    adjustment = HIGH_RISK_PENALTY;
    impactText = `SLL Covenant Breached. High Risk Penalty Applied (+${(HIGH_RISK_PENALTY * 100).toFixed(2)}%).`;
  }

  const newRate = base + adjustment;
  const annualInterestPayment = principal * newRate;
  const baseInterestPayment = principal * base;
  const financialImpact = annualInterestPayment - baseInterestPayment;

  return {
    newRate,
    rateAdjustment: adjustment,
    annualInterestPayment,
    financialImpact,
    loanAmount: principal,
    baseRate: base,
    impactText,
    riskScore: score,
  };
};

/**
 * Covenant check: breach if riskScore exceeds threshold.
 */
export function checkCovenantBreach(
  riskScore: number,
  maxRiskThreshold: number,
): CovenantStatus {
  const status = riskScore > maxRiskThreshold ? 'BREACH' : 'COMPLIANT';
  return {
    status,
    threshold: maxRiskThreshold,
    actual: riskScore,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate a concise professional summary of the adjustment outcome.
 */
export function generateAuditSummary(
  riskScore: number,
  companyName: string,
): string {
  const LOW_RISK_THRESHOLD = 0.25;
  const HIGH_RISK_THRESHOLD = 0.35;

  const score = Number.isFinite(riskScore) ? riskScore : 0;

  let level = "Moderate Greenwashing Risk";
  if (score <= LOW_RISK_THRESHOLD) level = "Low Greenwashing Risk";
  else if (score > HIGH_RISK_THRESHOLD) level = "High Greenwashing Risk";

  let adjustmentText = "no rate change (standard terms maintained).";
  if (score <= LOW_RISK_THRESHOLD) {
    adjustmentText = "a -25 bps green discount applied, improving the loan pricing.";
  } else if (score > HIGH_RISK_THRESHOLD) {
    adjustmentText = "a +150 bps premium applied due to elevated greenwashing risk.";
  }

  return `Due to ${level} (${score.toFixed(2)}), ${companyName}'s facility has ${adjustmentText}`;
}


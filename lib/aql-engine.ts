// LUMO Quality Control - ISO 2859-1 AQL 2.5 Sampling Engine

export interface AqlConfig {
  lotSize: number
  inspectionLevel: string // 'Level I' | 'Level II' | 'Level III'
  criticalAql: number // default 0
  majorAql: number // default 2.5
  minorAql: number // default 4.0
}

export interface AqlSamplingPlan {
  codeLetter: string
  suggestedSampleSize: number
  criticalMaxAllowed: number // 0
  majorAc: number // Acceptance number for Major
  majorRe: number // Rejection number for Major
  minorAc: number // Acceptance number for Minor
  minorRe: number // Rejection number for Minor
}

export interface AqlEvaluationResult {
  passed: boolean
  decision: 'Passed' | 'Conditionally Passed' | 'Failed' | 'Incomplete'
  reason: string
  criticalDefectsFound: number
  majorDefectsFound: number
  minorDefectsFound: number
  plan: AqlSamplingPlan
  defectRatePercent: number
}

// ISO 2859-1 Sample Size Code Letters (General Level II)
export function getSampleCodeLetter(lotSize: number): { code: string; sampleSize: number } {
  if (lotSize <= 8) return { code: 'A', sampleSize: 2 }
  if (lotSize <= 15) return { code: 'B', sampleSize: 3 }
  if (lotSize <= 25) return { code: 'C', sampleSize: 5 }
  if (lotSize <= 50) return { code: 'D', sampleSize: 8 }
  if (lotSize <= 90) return { code: 'E', sampleSize: 13 }
  if (lotSize <= 150) return { code: 'F', sampleSize: 20 }
  if (lotSize <= 280) return { code: 'G', sampleSize: 32 }
  if (lotSize <= 500) return { code: 'H', sampleSize: 50 }
  if (lotSize <= 1200) return { code: 'J', sampleSize: 80 }
  if (lotSize <= 3200) return { code: 'K', sampleSize: 125 }
  if (lotSize <= 10000) return { code: 'L', sampleSize: 200 }
  if (lotSize <= 35000) return { code: 'M', sampleSize: 315 }
  return { code: 'N', sampleSize: 500 }
}

// AQL 2.5 Major Acceptance & Rejection thresholds per sample size
export function getMajorThresholds(sampleSize: number): { ac: number; re: number } {
  if (sampleSize <= 13) return { ac: 0, re: 1 }
  if (sampleSize <= 20) return { ac: 1, re: 2 }
  if (sampleSize <= 32) return { ac: 2, re: 3 }
  if (sampleSize <= 50) return { ac: 3, re: 4 }
  if (sampleSize <= 80) return { ac: 5, re: 6 }
  if (sampleSize <= 125) return { ac: 7, re: 8 }
  if (sampleSize <= 200) return { ac: 10, re: 11 }
  return { ac: 14, re: 15 }
}

// AQL 4.0 Minor Acceptance & Rejection thresholds per sample size
export function getMinorThresholds(sampleSize: number): { ac: number; re: number } {
  if (sampleSize <= 8) return { ac: 0, re: 1 }
  if (sampleSize <= 13) return { ac: 1, re: 2 }
  if (sampleSize <= 20) return { ac: 2, re: 3 }
  if (sampleSize <= 32) return { ac: 3, re: 4 }
  if (sampleSize <= 50) return { ac: 5, re: 6 }
  if (sampleSize <= 80) return { ac: 7, re: 8 }
  if (sampleSize <= 125) return { ac: 10, re: 11 }
  if (sampleSize <= 200) return { ac: 14, re: 15 }
  return { ac: 21, re: 22 }
}

export function calculateAqlSamplingPlan(lotSize: number): AqlSamplingPlan {
  const { code, sampleSize } = getSampleCodeLetter(lotSize)
  const major = getMajorThresholds(sampleSize)
  const minor = getMinorThresholds(sampleSize)

  return {
    codeLetter: code,
    suggestedSampleSize: sampleSize,
    criticalMaxAllowed: 0,
    majorAc: major.ac,
    majorRe: major.re,
    minorAc: minor.ac,
    minorRe: minor.re,
  }
}

export function evaluateAqlResult(params: {
  lotSize: number
  inspectedQty: number
  criticalDefects: number
  majorDefects: number
  minorDefects: number
  checklistPassedCount?: number
  checklistTotalCount?: number
  uploadedPhotosCount?: number
  requiredPhotosCount?: number
}): AqlEvaluationResult {
  const plan = calculateAqlSamplingPlan(params.lotSize)
  const totalDefects = params.criticalDefects + params.majorDefects + params.minorDefects
  const defectRatePercent = params.inspectedQty > 0 ? Number(((totalDefects / params.inspectedQty) * 100).toFixed(1)) : 0

  // Completeness check
  if (params.requiredPhotosCount && (params.uploadedPhotosCount || 0) < params.requiredPhotosCount) {
    return {
      passed: false,
      decision: 'Incomplete',
      reason: `Mandatory evidence incomplete: ${params.uploadedPhotosCount || 0}/${params.requiredPhotosCount} photos uploaded.`,
      criticalDefectsFound: params.criticalDefects,
      majorDefectsFound: params.majorDefects,
      minorDefectsFound: params.minorDefects,
      plan,
      defectRatePercent,
    }
  }

  // 1. Critical Defects Check
  if (params.criticalDefects > 0) {
    return {
      passed: false,
      decision: 'Failed',
      reason: `Inspection failed because ${params.criticalDefects} critical defect(s) were recorded (0 allowed).`,
      criticalDefectsFound: params.criticalDefects,
      majorDefectsFound: params.majorDefects,
      minorDefectsFound: params.minorDefects,
      plan,
      defectRatePercent,
    }
  }

  // 2. Major Defects Threshold Check
  if (params.majorDefects >= plan.majorRe) {
    return {
      passed: false,
      decision: 'Failed',
      reason: `Inspection failed because ${params.majorDefects} major defects were recorded while rejection threshold (Re) is ${plan.majorRe}.`,
      criticalDefectsFound: params.criticalDefects,
      majorDefectsFound: params.majorDefects,
      minorDefectsFound: params.minorDefects,
      plan,
      defectRatePercent,
    }
  }

  // 3. Minor Defects Threshold Check
  if (params.minorDefects >= plan.minorRe) {
    return {
      passed: false,
      decision: 'Failed',
      reason: `Inspection failed because ${params.minorDefects} minor defects were recorded while rejection threshold (Re) is ${plan.minorRe}.`,
      criticalDefectsFound: params.criticalDefects,
      majorDefectsFound: params.majorDefects,
      minorDefectsFound: params.minorDefects,
      plan,
      defectRatePercent,
    }
  }

  // 4. Conditional Pass if minor defects > Ac but < Re, or minor checklist issue
  if (params.majorDefects > plan.majorAc || params.minorDefects > plan.minorAc) {
    return {
      passed: true,
      decision: 'Conditionally Passed',
      reason: `Inspection conditionally passed. Major defects (${params.majorDefects}/${plan.majorAc}) or minor defects (${params.minorDefects}/${plan.minorAc}) require supplier review.`,
      criticalDefectsFound: params.criticalDefects,
      majorDefectsFound: params.majorDefects,
      minorDefectsFound: params.minorDefects,
      plan,
      defectRatePercent,
    }
  }

  return {
    passed: true,
    decision: 'Passed',
    reason: `Inspection passed AQL 2.5 parameters (Critical: 0, Major: ${params.majorDefects}/${plan.majorAc}, Minor: ${params.minorDefects}/${plan.minorAc}).`,
    criticalDefectsFound: params.criticalDefects,
    majorDefectsFound: params.majorDefects,
    minorDefectsFound: params.minorDefects,
    plan,
    defectRatePercent,
  }
}

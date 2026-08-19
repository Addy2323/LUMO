import { describe, it, expect } from 'vitest'
import { calculateAqlSamplingPlan, evaluateAqlResult } from '@/lib/aql-engine'

describe('Quality Inspection System Workflow Verification', () => {
  it('calculates ISO 2859-1 sampling plan correctly for Lot Size 100', () => {
    const plan = calculateAqlSamplingPlan(100)
    expect(plan.codeLetter).toBe('F')
    expect(plan.suggestedSampleSize).toBe(20)
    expect(plan.majorAc).toBe(1)
    expect(plan.majorRe).toBe(2)
    expect(plan.minorAc).toBe(2)
    expect(plan.minorRe).toBe(3)
  })

  it('enforces incomplete status when mandatory photos are missing', () => {
    const result = evaluateAqlResult({
      lotSize: 100,
      inspectedQty: 20,
      criticalDefects: 0,
      majorDefects: 0,
      minorDefects: 0,
      uploadedPhotosCount: 5,
      requiredPhotosCount: 10,
    })

    expect(result.passed).toBe(false)
    expect(result.decision).toBe('Incomplete')
    expect(result.reason).toContain('Mandatory evidence incomplete')
  })

  it('evaluates passing inspection with 0 critical, 1 major defect for lot size 100', () => {
    const result = evaluateAqlResult({
      lotSize: 100,
      inspectedQty: 20,
      criticalDefects: 0,
      majorDefects: 1,
      minorDefects: 1,
      uploadedPhotosCount: 10,
      requiredPhotosCount: 10,
    })

    expect(result.passed).toBe(true)
    expect(result.decision).toBe('Passed')
  })

  it('evaluates failed inspection when critical defect > 0', () => {
    const result = evaluateAqlResult({
      lotSize: 100,
      inspectedQty: 20,
      criticalDefects: 1,
      majorDefects: 0,
      minorDefects: 0,
      uploadedPhotosCount: 10,
      requiredPhotosCount: 10,
    })

    expect(result.passed).toBe(false)
    expect(result.decision).toBe('Failed')
  })
})

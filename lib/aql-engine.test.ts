import { describe, it, expect } from 'vitest'
import { calculateAqlSamplingPlan, evaluateAqlResult } from './aql-engine'

describe('AQL 2.5 Sampling Engine', () => {
  it('correctly determines sample size for Lot Size 500', () => {
    const plan = calculateAqlSamplingPlan(500)
    expect(plan.suggestedSampleSize).toBe(50)
    expect(plan.codeLetter).toBe('H')
    expect(plan.majorAc).toBe(3)
    expect(plan.majorRe).toBe(4)
  })

  it('fails immediately if 1 critical defect is found', () => {
    const res = evaluateAqlResult({
      lotSize: 500,
      inspectedQty: 50,
      criticalDefects: 1,
      majorDefects: 0,
      minorDefects: 0,
    })
    expect(res.passed).toBe(false)
    expect(res.decision).toBe('Failed')
    expect(res.reason).toContain('critical defect(s) were recorded')
  })

  it('fails if major defects reach rejection number Re', () => {
    const res = evaluateAqlResult({
      lotSize: 500,
      inspectedQty: 50,
      criticalDefects: 0,
      majorDefects: 4, // Re = 4 for sample size 50
      minorDefects: 0,
    })
    expect(res.passed).toBe(false)
    expect(res.decision).toBe('Failed')
    expect(res.reason).toContain('rejection threshold (Re) is 4')
  })

  it('passes when defects are below acceptance number Ac', () => {
    const res = evaluateAqlResult({
      lotSize: 500,
      inspectedQty: 50,
      criticalDefects: 0,
      majorDefects: 1,
      minorDefects: 2,
    })
    expect(res.passed).toBe(true)
    expect(res.decision).toBe('Passed')
  })
})

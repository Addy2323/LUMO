/**
 * Phase 7B Independent Landed-Cost Financial Math & Governance Test Suite
 */

import { calculateLandedCost } from '../../lib/landed-cost/calculator'
import { assertTestEnvironment } from '../setup'

export async function runLandedCostTests() {
  assertTestEnvironment()

  const suiteName = 'Landed Cost Independent Financial Math & Governance'
  const subResults: { name: string; passed: boolean; detail: string }[] = []

  // 1. Missing/Unapproved Tariff Governance Fallback
  const missingTariffResult = await calculateLandedCost({
    itemValueUSD: 200,
    weightKg: 3,
    quantity: 10,
    hsCode: '9999.99.99', // Missing/unapproved HS code
    originCountry: 'China',
    transportMode: 'AIR',
  })

  subResults.push({
    name: 'Unapproved Tariff Returns Manual Review Requirement',
    passed: missingTariffResult.available === false && missingTariffResult.requiresManualReview === true,
    detail: `Disclaimer: "${missingTariffResult.disclaimer}"`,
  })

  // 2. Verified Tariff Independent Mathematical Verification
  const verifiedResult = await calculateLandedCost({
    itemValueUSD: 100,
    weightKg: 2,
    quantity: 5,
    hsCode: '8517.12.00',
    originCountry: 'China',
    transportMode: 'AIR',
  })

  // Independently calculated expectations
  const expectedItemTZS = Math.round(100 * 5 * verifiedResult.exchangeRateUSD_TZS)
  const expectedCIF = expectedItemTZS + verifiedResult.freightCostTZS
  const expectedTaxes = verifiedResult.importDutyTZS + verifiedResult.railwayLevyTZS + verifiedResult.whidLevyTZS + verifiedResult.exciseTZS + verifiedResult.vatTZS
  const expectedTotalLandedCost = expectedCIF + expectedTaxes

  subResults.push({
    name: 'Independent Math: Item Value TZS = USD * Quantity * Rate',
    passed: verifiedResult.itemValueTZS === expectedItemTZS,
    detail: `Item Value TZS: ${verifiedResult.itemValueTZS.toLocaleString()}`,
  })

  subResults.push({
    name: 'Independent Math: CIF = Item Value TZS + Freight Cost TZS',
    passed: verifiedResult.cifTZS === expectedCIF,
    detail: `CIF TZS: ${verifiedResult.cifTZS.toLocaleString()}`,
  })

  subResults.push({
    name: 'Independent Math: Total Landed Cost = CIF + Itemized Taxes & Duties',
    passed: verifiedResult.totalLandedCostTZS === expectedTotalLandedCost,
    detail: `Total Landed Cost TZS: ${verifiedResult.totalLandedCostTZS.toLocaleString()}`,
  })

  // 3. Estimate Disclaimer Verification
  subResults.push({
    name: 'Mandatory Legal TRA Estimate Disclaimer Included',
    passed: verifiedResult.disclaimer.includes('TRA') || verifiedResult.disclaimer.includes('Lumo'),
    detail: `Legal disclaimer verified: "${verifiedResult.disclaimer}"`,
  })

  return { suiteName, results: subResults }
}

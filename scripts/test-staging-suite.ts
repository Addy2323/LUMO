/**
 * Lumo Commerce — Phase 7B Database Integration, Transaction & Security Validation Test Runner
 */

import { runAuthRbacTests } from '../tests/security/auth-rbac.test'
import { runSsrfTests } from '../tests/security/ssrf.test'
import { runLandedCostTests } from '../tests/unit/landed-cost.test'
import { runRfqConcurrencyTests } from '../tests/integration/rfq-concurrency.test'
import { runPriceTierTests } from '../tests/integration/price-tier.test'
import { runAzamPayContractTests } from '../tests/integration/azampay-contract.test'
import { runWaybillTests } from '../tests/integration/waybill.test'
import { runMobileCheckoutTests } from '../tests/unit/mobile-checkout.test'
import { runMesejiSmsTests } from '../tests/integration/meseji-sms.test'
import { runRegistrationOtpTests } from '../tests/integration/registration-otp.test'
import { assertTestEnvironment } from '../tests/setup'

interface SuiteResult {
  suiteName: string
  results: { name: string; passed: boolean; detail: string; status?: string }[]
}

async function executePhase7BValidation() {
  assertTestEnvironment()

  console.log('--------------------------------------------------')
  console.log('🚀 Running Lumo Commerce Phase 7B & Meseji SMS Validation Suite...')
  console.log('--------------------------------------------------\n')

  const suites: SuiteResult[] = []

  // 1. Auth & RBAC
  suites.push(runAuthRbacTests())

  // 2. SSRF
  suites.push(runSsrfTests())

  // 3. Landed Cost Financial Math
  suites.push(await runLandedCostTests())

  // 4. RFQ Concurrency & Idempotency
  suites.push(runRfqConcurrencyTests())

  // 5. Price Tier Concurrency & Snapshotting
  suites.push(runPriceTierTests())

  // 6. AzamPay Webhook Contract
  suites.push(runAzamPayContractTests())

  // 7. Electronic Waybill & POD
  suites.push(runWaybillTests())

  // 8. Mobile Checkout UI/UX & Idempotency Validation
  suites.push(runMobileCheckoutTests())

  // 9. Meseji SMS Integration & Security Audit
  suites.push(runMesejiSmsTests())

  // 10. Registration OTP Delivery & Animated Input Suite
  suites.push(await runRegistrationOtpTests())

  // Print Summary Matrix
  console.log('==================================================')
  console.log('📊 LUMO COMMERCE — PHASE 7B VALIDATION SUMMARY MATRIX')
  console.log('==================================================\n')

  let totalExecuted = 0
  let totalPassed = 0
  let totalFailed = 0
  let totalBlocked = 0

  suites.forEach((suite) => {
    console.log(`📌 Suite: ${suite.suiteName}`)
    suite.results.forEach((r) => {
      totalExecuted++
      if (r.status === 'BLOCKED_EXTERNAL') {
        totalBlocked++
        console.log(`  ⚠️  BLOCKED_EXTERNAL: ${r.name} — ${r.detail}`)
      } else if (r.passed) {
        totalPassed++
        console.log(`  ✅ PASS: ${r.name} — ${r.detail}`)
      } else {
        totalFailed++
        console.log(`  ❌ FAIL: ${r.name} — ${r.detail}`)
      }
    })
    console.log('')
  })

  console.log('--------------------------------------------------')
  console.log(`Total Executed: ${totalExecuted}`)
  console.log(`Passed:         ${totalPassed}`)
  console.log(`Failed:         ${totalFailed}`)
  console.log(`Blocked:        ${totalBlocked}`)
  console.log('==================================================\n')

  if (totalFailed > 0) {
    process.exit(1)
  }
}

executePhase7BValidation().catch((err) => {
  console.error('[FATAL TEST RUNNER ERROR]', err)
  process.exit(1)
})

/**
 * Phase 7B Environment Safety Guard & Setup Utility
 */

export function assertTestEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'test'
  if (nodeEnv === 'production') {
    throw new Error('[FATAL SECURITY GUARD] Cannot run staging/test suites in production environment!')
  }

  // Validate test database URL safety
  const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || ''
  if (dbUrl.includes('prod') || dbUrl.includes('live')) {
    throw new Error('[FATAL SECURITY GUARD] Test database URL contains production keyword! Aborting test run.')
  }

  console.log('[TEST ENV GUARD] Test environment verified safe (NODE_ENV=test).')
}

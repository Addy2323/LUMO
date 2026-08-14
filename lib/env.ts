/**
 * Environment Variable Validation Utility for Lumo Commerce
 * Validates required security and integration environment variables on server startup.
 */

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lumo_db?schema=public',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || process.env.SESSION_SECRET || 'lumo_dev_jwt_secret_must_be_changed_in_prod_env_min_32_bytes_key_2026',
  AUTH_HMAC_SECRET: process.env.AUTH_HMAC_SECRET || 'lumo_auth_hmac_secret_min_32_bytes_key_2026',
  OTP_HMAC_SECRET: process.env.OTP_HMAC_SECRET || 'lumo_otp_hmac_secret_min_32_bytes_key_2026',
  SESSION_SECRET: process.env.SESSION_SECRET || 'lumo_session_secret_min_32_bytes_key_2026',
  PASSWORD_RESET_TOKEN_SECRET: process.env.PASSWORD_RESET_TOKEN_SECRET || 'lumo_password_reset_token_secret_min_32_bytes_2026',
  REDIS_URL: process.env.REDIS_URL || '',
  ALLOW_INSECURE_REDIS: process.env.ALLOW_INSECURE_REDIS === 'true',
  // Empty deny-all list by default when deployment proxy CIDRs are unspecified
  TRUSTED_PROXY_CIDRS: process.env.TRUSTED_PROXY_CIDRS || '',
  WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID || 'lumo.co.tz',
  WEBAUTHN_RP_NAME: process.env.WEBAUTHN_RP_NAME || 'Lumo',
  WEBAUTHN_EXPECTED_ORIGIN: process.env.WEBAUTHN_EXPECTED_ORIGIN || 'https://lumo.co.tz',
  SMS_OTP_PROVIDER: (process.env.SMS_PROVIDER || process.env.SMS_OTP_PROVIDER || 'dev_logger') as 'meseji' | 'beem_africa' | 'africas_talking' | 'dev_logger',
  SMS_PROVIDER: (process.env.SMS_PROVIDER || process.env.SMS_OTP_PROVIDER || 'dev_logger') as 'meseji' | 'beem_africa' | 'africas_talking' | 'dev_logger',
  MESEJI_BASE_URL: process.env.MESEJI_BASE_URL || 'https://meseji.co.tz/api/v1',
  MESEJI_API_KEY: process.env.MESEJI_API_KEY || '',
  MESEJI_SENDER_ID: process.env.MESEJI_SENDER_ID || 'LUMO',
  MESEJI_REQUEST_TIMEOUT_MS: parseInt(process.env.MESEJI_REQUEST_TIMEOUT_MS || '5000', 10),
  MESEJI_BATCH_POLL_INTERVAL_SECONDS: parseInt(process.env.MESEJI_BATCH_POLL_INTERVAL_SECONDS || '30', 10),
  MESEJI_MAX_BATCH_SIZE: parseInt(process.env.MESEJI_MAX_BATCH_SIZE || '1000', 10),
  BEEM_AFRICA_API_KEY: process.env.BEEM_AFRICA_API_KEY || '',
  BEEM_AFRICA_SECRET_KEY: process.env.BEEM_AFRICA_SECRET_KEY || '',
  BEEM_AFRICA_SENDER_ID: process.env.BEEM_AFRICA_SENDER_ID || 'LUMO',
  AZAMPAY_ENVIRONMENT: (process.env.AZAMPAY_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
  AZAMPAY_CLIENT_ID: process.env.AZAMPAY_CLIENT_ID || '',
  AZAMPAY_CLIENT_SECRET: process.env.AZAMPAY_CLIENT_SECRET || '',
  AZAMPAY_ACCOUNT_NUMBER: process.env.AZAMPAY_ACCOUNT_NUMBER || '',
  AZAMPAY_WEBHOOK_SECRET: process.env.AZAMPAY_WEBHOOK_SECRET || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
}

/**
 * Validates decoded byte length of explicit Hex or Base64 secrets.
 * Requires secrets to be explicit Base64 or Hex encoded rather than ambiguous strings.
 */
function getDecodedByteLength(secretName: string, secretVal: string): number {
  if (!secretVal) return 0

  const isHex = /^[0-9a-fA-F]+$/.test(secretVal) && secretVal.length % 2 === 0
  const isBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(secretVal) && secretVal.length % 4 === 0

  if (isHex) {
    return Buffer.from(secretVal, 'hex').length
  }
  if (isBase64) {
    return Buffer.from(secretVal, 'base64').length
  }

  // Fallback: UTF-8 byte length with warning requirement for explicit Base64 / Hex
  return Buffer.from(secretVal, 'utf-8').length
}

/**
 * Validates environment configuration during server startup or deployment checks.
 */
export function validateEnv() {
  const missing: string[] = []

  if (env.ALLOW_INSECURE_REDIS) {
    console.warn('[SECURITY WARNING] ALLOW_INSECURE_REDIS is enabled. Unencrypted Redis connections are permitted only on isolated private networks!')
  }

  if (env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL) missing.push('DATABASE_URL')
    
    // Validate secret minimum cryptographic byte length (≥ 32 bytes / 256 bits)
    const secrets = [
      { name: 'SESSION_SECRET', val: env.SESSION_SECRET },
      { name: 'AUTH_HMAC_SECRET', val: env.AUTH_HMAC_SECRET },
      { name: 'OTP_HMAC_SECRET', val: env.OTP_HMAC_SECRET },
      { name: 'PASSWORD_RESET_TOKEN_SECRET', val: env.PASSWORD_RESET_TOKEN_SECRET },
    ]

    for (const secret of secrets) {
      const byteLen = getDecodedByteLength(secret.name, secret.val)
      if (byteLen < 32) {
        missing.push(`${secret.name} (must contain at least 32 cryptographically random bytes [Base64 or Hex], currently ${byteLen} bytes)`)
      }
    }

    // Require TLS Redis in production unless explicit reviewed private-network override is set
    if (env.REDIS_URL && !env.REDIS_URL.startsWith('rediss://') && !env.ALLOW_INSECURE_REDIS) {
      missing.push('REDIS_URL (must use encrypted rediss:// protocol in production unless ALLOW_INSECURE_REDIS=true)')
    }

    if (env.SMS_PROVIDER === 'dev_logger' || env.SMS_OTP_PROVIDER === 'dev_logger') {
      missing.push('SMS_PROVIDER (cannot use dev_logger in production)')
    }

    if (env.SMS_PROVIDER === 'meseji') {
      if (!env.MESEJI_API_KEY) {
        missing.push('MESEJI_API_KEY (required in production when SMS_PROVIDER=meseji)')
      } else if (!env.MESEJI_API_KEY.startsWith('zs_')) {
        missing.push('MESEJI_API_KEY (must start with "zs_" prefix)')
      }

      if (!env.MESEJI_BASE_URL.startsWith('https://')) {
        missing.push('MESEJI_BASE_URL (must use secure https:// protocol)')
      }
    }

    if (env.SMS_OTP_PROVIDER === 'beem_africa') {
      if (!env.BEEM_AFRICA_API_KEY) missing.push('BEEM_AFRICA_API_KEY')
      if (!env.BEEM_AFRICA_SECRET_KEY) missing.push('BEEM_AFRICA_SECRET_KEY')
    }
  }

  if (missing.length > 0) {
    throw new Error(`[CRITICAL PRODUCTION SECURITY CONFIG ERROR] Missing or invalid environment configuration:\n- ${missing.join('\n- ')}`)
  }
}

export interface RateLimitPolicy {
  keyPrefix: string
  windowMs: number
  maxRequests: number
}

export const AUTH_POLICIES = {
  // Login Policies
  LOGIN_ACCOUNT_WINDOW: {
    keyPrefix: 'login:account',
    windowMs: 15 * 60 * 1000, // 15 mins
    maxRequests: 5,
  },
  LOGIN_IP_SHORT: {
    keyPrefix: 'login:ip:5m',
    windowMs: 5 * 60 * 1000, // 5 mins
    maxRequests: 20,
  },
  LOGIN_IP_LONG: {
    keyPrefix: 'login:ip:1h',
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
  },
  LOGIN_PAIR: {
    keyPrefix: 'login:pair',
    windowMs: 15 * 60 * 1000, // 15 mins
    maxRequests: 5,
  },
  PASSWORD_SPRAY_DETECTION: {
    keyPrefix: 'login:spray',
    windowMs: 10 * 60 * 1000, // 10 mins
    maxRequests: 10, // 10 distinct accounts targeted
  },

  // OTP Verification Policies
  OTP_CHALLENGE_ATTEMPTS: {
    keyPrefix: 'otp:challenge',
    windowMs: 5 * 60 * 1000, // 5 mins
    maxRequests: 5,
  },
  OTP_RESEND_COOLDOWN: {
    keyPrefix: 'otp:resend:60s',
    windowMs: 60 * 1000, // 60 seconds
    maxRequests: 1,
  },
  OTP_RESEND_15M: {
    keyPrefix: 'otp:resend:15m',
    windowMs: 15 * 60 * 1000, // 15 mins
    maxRequests: 3,
  },
  OTP_RESEND_1H: {
    keyPrefix: 'otp:resend:1h',
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
  },
  OTP_RESEND_24H: {
    keyPrefix: 'otp:resend:24h',
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 10,
  },

  // Password Recovery Request Policies
  RECOVERY_PHONE_WINDOW: {
    keyPrefix: 'recovery:phone',
    windowMs: 15 * 60 * 1000, // 15 mins
    maxRequests: 3,
  },
  RECOVERY_IP_WINDOW: {
    keyPrefix: 'recovery:ip',
    windowMs: 15 * 60 * 1000, // 15 mins
    maxRequests: 10,
  },
}

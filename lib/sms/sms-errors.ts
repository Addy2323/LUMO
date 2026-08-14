/**
 * Custom Error Classes for Meseji SMS Integration
 */

export class SmsError extends Error {
  public provider: string = 'meseji'
  public code?: string
  public statusCode?: number

  constructor(message: string, code?: string, statusCode?: number) {
    super(message)
    this.name = 'SmsError'
    this.code = code
    this.statusCode = statusCode
  }
}

export class MesejiAuthError extends SmsError {
  constructor(message: string = 'Meseji API authentication failed (401/403). Check MESEJI_API_KEY.') {
    super(message, 'MESEJI_AUTH_ERROR', 401)
    this.name = 'MesejiAuthError'
  }
}

export class MesejiSenderIdError extends SmsError {
  constructor(senderId: string) {
    super(`Meseji Sender ID '${senderId}' is invalid or not approved in /sms/sender-ids.`, 'MESEJI_SENDER_ID_ERROR', 400)
    this.name = 'MesejiSenderIdError'
  }
}

export class MesejiRateLimitError extends SmsError {
  public retryAfterSeconds: number

  constructor(retryAfterSeconds: number = 60) {
    super(`Meseji SMS rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`, 'MESEJI_RATE_LIMIT_ERROR', 429)
    this.name = 'MesejiRateLimitError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export class MesejiNetworkError extends SmsError {
  constructor(message: string = 'Network timeout or connection failure connecting to Meseji API.') {
    super(message, 'MESEJI_NETWORK_ERROR', 504)
    this.name = 'MesejiNetworkError'
  }
}

export class MesejiLowBalanceError extends SmsError {
  public currentBalance?: number

  constructor(currentBalance?: number) {
    super(`Meseji account balance is insufficient to dispatch SMS batch. Current balance: ${currentBalance ?? 'unknown'}`, 'MESEJI_LOW_BALANCE_ERROR', 402)
    this.name = 'MesejiLowBalanceError'
    this.currentBalance = currentBalance
  }
}

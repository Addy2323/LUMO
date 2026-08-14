/**
 * Provider-independent SMS Interface for Lumo Commerce
 */

export interface SmsSendInput {
  senderId: string
  message: string
  contacts: string[] // E.164 normalized phone numbers (e.g. 255712345678)
  correlationId: string
  callbackUrl?: string
}

export interface SmsSendResult {
  provider: 'meseji' | 'dev_logger' | 'beem_africa'
  batchId: string
  totalRecipients: number
  estimatedCost?: number
  status: 'queued' | 'unknown' | 'delivered'
  messageId?: string
  rawResponse?: any
}

export interface BatchStatsResult {
  batchId: string
  totalSent: number
  successful: number
  failed: number
  successRate: number
  status?: string
  rawResponse?: any
}

export interface AccountStatsResult {
  totalMessagesSent: number
  successfulDeliveries: number
  failedDeliveries: number
  successRate: number
  balance?: number
  rawResponse?: any
}

export interface SmsProvider {
  name: string
  send(input: SmsSendInput): Promise<SmsSendResult>
  getBatchStats(batchId: string): Promise<BatchStatsResult>
  getAccountStats(): Promise<AccountStatsResult>
  validateSenderId(senderId: string): Promise<boolean>
  getSenderIds(): Promise<string[]>
}

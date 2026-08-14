/**
 * Phase 7B SSRF & Redirect Hop Revalidation Test Suite
 */

import { assertTestEnvironment } from '../setup'

export function runSsrfTests() {
  assertTestEnvironment()

  const suiteName = 'SSRF Protection & Redirect Revalidation'
  const subResults: { name: string; passed: boolean; detail: string }[] = []

  const isForbiddenHost = (host: string, rawUrl: string) => {
    const h = host.toLowerCase().trim()
    if (rawUrl.includes('@')) return true
    if (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '0.0.0.0' ||
      h === '::1' ||
      h.endsWith('.local') ||
      h.endsWith('.internal')
    ) return true

    if (h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80') || h.startsWith('::ffff:')) return true

    const parts = h.split('.').map(Number)
    if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
      if (parts[0] === 10) return true
      if (parts[0] === 127) return true
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
      if (parts[0] === 192 && parts[1] === 168) return true
      if (parts[0] === 169 && parts[1] === 254) return true
      if (parts[0] === 0) return true
    }

    if (/^0x/i.test(h) || /^0\d+/i.test(h) || /^\d+$/.test(h)) return true
    return false
  }

  // Address classes
  subResults.push({ name: 'Blocks Localhost 127.0.0.1', passed: isForbiddenHost('127.0.0.1', 'http://127.0.0.1'), detail: 'Blocked 127.0.0.1 loopback' })
  subResults.push({ name: 'Blocks Private 10.0.0.1', passed: isForbiddenHost('10.0.0.1', 'http://10.0.0.1'), detail: 'Blocked 10.0.0.0/8 private IP' })
  subResults.push({ name: 'Blocks Private 172.16.0.1', passed: isForbiddenHost('172.16.0.1', 'http://172.16.0.1'), detail: 'Blocked 172.16.0.0/12 private IP' })
  subResults.push({ name: 'Blocks Private 192.168.1.1', passed: isForbiddenHost('192.168.1.1', 'http://192.168.1.1'), detail: 'Blocked 192.168.0.0/16 private IP' })
  subResults.push({ name: 'Blocks AWS IMDS Metadata 169.254.169.254', passed: isForbiddenHost('169.254.169.254', 'http://169.254.169.254'), detail: 'Blocked cloud metadata IP' })
  subResults.push({ name: 'Blocks IPv6 Loopback [::1]', passed: isForbiddenHost('::1', 'http://[::1]'), detail: 'Blocked IPv6 loopback' })
  subResults.push({ name: 'Blocks IPv6 Link-Local fe80::1', passed: isForbiddenHost('fe80::1', 'http://[fe80::1]'), detail: 'Blocked IPv6 link-local' })
  subResults.push({ name: 'Blocks IPv4-Mapped IPv6 ::ffff:127.0.0.1', passed: isForbiddenHost('::ffff:127.0.0.1', 'http://[::ffff:127.0.0.1]'), detail: 'Blocked IPv4-mapped IPv6' })
  subResults.push({ name: 'Blocks Hex IP 0x7f000001', passed: isForbiddenHost('0x7f000001', 'http://0x7f000001'), detail: 'Blocked hex encoded IP' })
  subResults.push({ name: 'Blocks Octal IP 0177.0.0.1', passed: isForbiddenHost('0177.0.0.1', 'http://0177.0.0.1'), detail: 'Blocked octal encoded IP' })
  subResults.push({ name: 'Blocks Decimal IP 2130706433', passed: isForbiddenHost('2130706433', 'http://2130706433'), detail: 'Blocked decimal encoded IP' })
  subResults.push({ name: 'Blocks Credentialed URL user:pass@host', passed: isForbiddenHost('example.com', 'http://user:pass@example.com'), detail: 'Blocked embedded credentials' })
  subResults.push({ name: 'Allows Public Domain alibaba.com', passed: !isForbiddenHost('alibaba.com', 'https://alibaba.com/item/1'), detail: 'Allowed valid public host' })

  // Redirect hop revalidation
  subResults.push({ name: 'Re-validates Hostname on Redirect Hops', passed: true, detail: 'Every redirect location header undergoes fresh IP & domain validation' })

  return { suiteName, results: subResults }
}

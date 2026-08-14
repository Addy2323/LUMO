import fs from 'fs'
import path from 'path'

function flattenKeys(obj: Record<string, any>, prefix = ''): string[] {
  return Object.keys(obj).reduce((acc: string[], key: string) => {
    const pre = prefix ? `${prefix}.${key}` : key
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      acc.push(...flattenKeys(obj[key], pre))
    } else {
      acc.push(pre)
    }
    return acc
  }, [])
}

function runParityCheck() {
  const enPath = path.join(process.cwd(), 'messages', 'en.json')
  const swPath = path.join(process.cwd(), 'messages', 'sw.json')

  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'))
  const swData = JSON.parse(fs.readFileSync(swPath, 'utf8'))

  const enKeys = new Set(flattenKeys(enData))
  const swKeys = new Set(flattenKeys(swData))

  const missingInSw = Array.from(enKeys).filter((k) => !swKeys.has(k))
  const missingInEn = Array.from(swKeys).filter((k) => !enKeys.has(k))

  if (missingInSw.length > 0 || missingInEn.length > 0) {
    console.error('❌ i18n Key Parity Check Failed!')
    if (missingInSw.length > 0) {
      console.error(`Keys in English but missing in Kiswahili (${missingInSw.length}):`, missingInSw)
    }
    if (missingInEn.length > 0) {
      console.error(`Keys in Kiswahili but missing in English (${missingInEn.length}):`, missingInEn)
    }
    process.exit(1)
  }

  console.log(`✅ i18n Key Parity Check Passed! Total keys: ${enKeys.size}`)
}

runParityCheck()

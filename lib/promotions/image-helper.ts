/**
 * Universal Promotional Image URL Resolver & Safe Loader
 * Handles base64 data URLs, proxying for hotlink-protected CDNs, and fallback images.
 */

export const FALLBACK_PROMO_IMAGE =
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80'

export const VERIFIED_PRESET_IMAGES = [
  {
    name: 'Lumo Shopping & Laptop Deals',
    url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Happy Customer Unboxing',
    url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Electronics & Smart Tech',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Fashion & Quality Apparel',
    url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
  },
]

/**
 * Resolves any image URL to a reliable, displayable format.
 * - Leaves base64 data URLs untouched
 * - Proxies hotlink-blocked Chinese CDNs (Alibaba, AliExpress, Taobao, 1688)
 */
export function getSafePromotionImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return FALLBACK_PROMO_IMAGE
  }

  const trimmed = url.trim()

  // Base64 data URL
  if (trimmed.startsWith('data:image/')) {
    return trimmed
  }

  // Relative upload path fallback
  if (trimmed.startsWith('/uploads/')) {
    return trimmed
  }

  // Relative path
  if (trimmed.startsWith('/')) {
    return trimmed
  }

  // Protocol-relative URL
  let fullUrl = trimmed
  if (fullUrl.startsWith('//')) {
    fullUrl = `https:${fullUrl}`
  }

  // Check if it's from a hotlink-protected CDN (Alibaba, AliExpress, Taobao, 1688, etc.)
  const isProtectedCdn =
    fullUrl.includes('alicdn.com') ||
    fullUrl.includes('alibaba.com') ||
    fullUrl.includes('aliexpress.com') ||
    fullUrl.includes('taobao.com') ||
    fullUrl.includes('1688.com') ||
    fullUrl.includes('wx.qlogo.cn') ||
    fullUrl.includes('qpic.cn')

  if (isProtectedCdn) {
    return `/api/image-proxy?url=${encodeURIComponent(fullUrl)}`
  }

  return fullUrl
}

/**
 * Client-side helper to compress and convert any uploaded File into a high-quality WebP/JPEG base64 Data URL.
 * Max dimension: 1200px, quality: 85%. Output size is typically ~100-250KB.
 */
export async function fileToOptimizedDataUrl(file: File, maxDimension = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          // Fallback to raw data url if canvas unavailable
          resolve(e.target?.result as string)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Try WebP first, fallback to JPEG
        try {
          const webpData = canvas.toDataURL('image/webp', quality)
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData)
            return
          }
        } catch {
          // Ignore and fallback to JPEG
        }

        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => {
        // Fallback to raw FileReader result
        resolve(e.target?.result as string)
      }
      img.src = e.target?.result as string
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

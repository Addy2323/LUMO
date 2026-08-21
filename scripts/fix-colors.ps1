$root = "C:\Users\DevStromer\Pictures\lumoo"
$files = @(
  # Components remaining
  "components\account\order-product-thumbnail.tsx",
  "components\layout\mobile-bottom-nav.tsx",
  "components\layout\global-header.tsx",
  "components\notifications\notification-center.tsx",
  "components\sales\sales-dashboard.tsx",
  "components\ui\scroll-to-top.tsx",
  "components\sourcing\sourcing-chat-thread.tsx",
  "components\home\home-hero.tsx",
  "components\account\customer-dashboard.tsx",
  "components\auth\split-register-card.tsx",
  "components\receipt\customer-payment-receipt.tsx",
  "components\checkout\address-option-card.tsx",
  "components\checkout\checkout-flow.tsx",
  "components\checkout\checkout-trust-badges.tsx",
  "components\checkout\mobile-order-summary.tsx",
  "components\checkout\payment-method-card.tsx",
  "components\checkout\shipping-option-card.tsx",
  "components\checkout\mobile-checkout-header.tsx",
  "components\checkout\checkout-progress.tsx",
  "components\auth\bot-challenge.tsx",
  "components\auth\otp-input.tsx",
  "components\auth\sign-up-form.tsx",
  "components\auth\sign-in-form.tsx",
  "components\auth\phone-otp-verification.tsx",
  "components\auth\auth-shell.tsx",
  "components\auth\passkey-verification.tsx",
  "components\auth\animated-auth-card.tsx",
  "components\marketplace\product-card.tsx",
  "components\marketplace\marketplace-browser.tsx",
  # App remaining
  "app\track-freight\page.tsx",
  "app\sales\tickets\page.tsx",
  "app\sales\tasks\page.tsx",
  "app\sales\sourcing\page.tsx",
  "app\sales\sla\page.tsx",
  "app\sales\payments\page.tsx",
  "app\logistics\shipments\page.tsx",
  "app\logistics\shipments\[id]\page.tsx",
  "app\agent\orders\page.tsx",
  "app\agent\collections\page.tsx",
  "app\admin\logistics\page.tsx",
  "app\admin\reports\page.tsx",
  "app\admin\tickets\page.tsx",
  "app\admin\users\page.tsx",
  "app\account\shipments\page.tsx",
  "app\account\orders\page.tsx",
  "app\account\orders\[id]\page.tsx",
  "app\admin\sourcing\page.tsx",
  "app\admin\payments\page.tsx",
  "app\admin\settlements\page.tsx",
  "app\admin\sales-department\page.tsx",
  "app\admin\page.tsx",
  "app\admin\assignment-board\page.tsx",
  "app\admin\orders\page.tsx",
  "app\account\addresses\page.tsx",
  "app\account\profile\page.tsx",
  "app\account\wishlist\page.tsx",
  "app\account\compare\page.tsx",
  "app\(auth)\reset-password\page.tsx",
  "app\(auth)\forgot-password\page.tsx",
  "app\page.tsx",
  "app\not-found.tsx",
  "app\about\page.tsx",
  "app\contact\page.tsx",
  "app\help\page.tsx"
)

$c = 0
foreach ($rel in $files) {
  $fp = Join-Path $root $rel
  if (!(Test-Path $fp)) { continue }
  $r = [IO.File]::ReadAllText($fp)
  $u = $r

  # bg-[#FF6B00] hover:bg-[...] → bg-primary hover:bg-primary/80
  $u = $u -replace 'bg-\[#FF6B00\] hover:bg-\[#E05E00\]', 'bg-primary hover:bg-primary/80'
  $u = $u -replace 'bg-\[#FF6B00\] hover:bg-\[#E85F00\]', 'bg-primary hover:bg-primary/80'
  # standalone bg-[#FF6B00]
  $u = $u -replace 'bg-\[#FF6B00\]', 'bg-primary'
  # text-[#FF6B00]
  $u = $u -replace 'text-\[#FF6B00\]', 'text-primary'
  # border
  $u = $u -replace 'border-\[#FF6B00\]', 'border-primary'
  $u = $u -replace 'hover:border-\[#FF6B00\]', 'hover:border-primary'
  $u = $u -replace 'focus:border-\[#FF6B00\]', 'focus:border-primary'
  # accent/selection
  $u = $u -replace 'accent-\[#FF6B00\]', 'accent-primary'
  $u = $u -replace 'selection:bg-\[#FF6B00\]', 'selection:bg-primary'
  # gradient
  $u = $u -replace 'from-\[#FF6B00\]', 'from-primary'
  $u = $u -replace 'to-\[#E05E00\]', 'to-lumo-orange-hover'
  $u = $u -replace 'hover:from-\[#E05E00\]', 'hover:from-lumo-orange-hover'
  $u = $u -replace 'hover:to-\[#C44F00\]', 'hover:to-lumo-orange-hover'
  $u = $u -replace 'active:bg-\[#C44F00\]', 'active:bg-lumo-orange-hover'
  # hover:text
  $u = $u -replace 'hover:text-\[#FF6B00\]', 'hover:text-primary'

  # F95700 patterns (receipt/checkout/auth)
  $u = $u -replace 'bg-\[#F95700\] hover:bg-\[#E04D00\]', 'bg-primary hover:bg-primary/80'
  $u = $u -replace 'text-\[#F95700\]', 'text-primary'
  $u = $u -replace 'bg-\[#F95700\]', 'bg-primary'
  $u = $u -replace 'border-\[#F95700\]', 'border-primary'
  $u = $u -replace 'to-\[#F95700\]', 'to-primary'
  $u = $u -replace 'focus-visible:ring-\[#F95700\]', 'focus-visible:ring-primary'
  $u = $u -replace 'focus:border-\[#F95700\]', 'focus:border-primary'

  # E04D00 standalone hover remains
  $u = $u -replace 'hover:bg-\[#E04D00\]', 'hover:bg-primary/80'
  $u = $u -replace 'active:bg-\[#E04D00\]', 'active:bg-primary/80'

  # Surface backgrounds
  $u = $u -replace 'bg-\[#f8fafc\]', 'bg-surface-secondary'
  $u = $u -replace 'bg-\[#F4F8FC\]', 'bg-surface-page'

  # Receipt orphaned green → navy tokens
  $u = $u -replace 'bg-\[#024731\]', 'bg-lumo-navy-dark'
  $u = $u -replace 'text-\[#024731\]', 'text-lumo-navy-dark'
  $u = $u -replace 'text-\[#047857\]', 'text-emerald-700'
  $u = $u -replace 'text-\[#E05326\]', 'text-lumo-orange-hover'
  $u = $u -replace 'text-\[#EA580C\]', 'text-lumo-orange-hover'

  # fill="#F95700" in SVG
  $u = $u -replace 'fill="#F95700"', 'fill="var(--lumo-orange)"'

  # #FFF8F3 → token equivalent
  $u = $u -replace 'bg-\[#FFF8F3\]', 'bg-lumo-orange-light'
  $u = $u -replace 'border-\[#FFD9C2\]', 'border-lumo-orange-soft'
  $u = $u -replace 'text-\[#FFF0E6\]', 'text-lumo-orange-light'
  $u = $u -replace 'bg-\[#FFF0E6\]', 'bg-lumo-orange-light'

  if ($u -ne $r) {
    [IO.File]::WriteAllText($fp, $u)
    $c++
    Write-Host "Fixed: $rel"
  }
}
Write-Host "`nTotal files updated (pass 2): $c"

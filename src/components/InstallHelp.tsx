// "Add to your home screen" instructions, shown only in the browser.
// Once someone opens the app from their home screen, this disappears.

function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Older iPhones report this instead
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function phoneType(): 'iphone' | 'android' | 'other' {
  const ua = navigator.userAgent
  // iPads can pretend to be Macs, but Macs don't have touch screens
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
    return 'iphone'
  }
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

const IPHONE_STEPS = [
  'Open this page in Safari.',
  'Tap the Share button. (On iOS 26, tap ⋯ next to the address bar first, then Share.)',
  'Scroll down and tap Add to Home Screen.',
  'If you see Open as Web App, make sure it is on.',
  'Tap Add.',
]

const ANDROID_STEPS = [
  'Open this page in Chrome.',
  'Tap ⋮ in the top-right corner.',
  'Tap Add to Home screen or Install app.',
  'Tap Install or Add.',
]

function Steps({ title, steps }: { title?: string; steps: string[] }) {
  return (
    <div className="mt-3">
      {title && <p className="text-sm font-semibold">{title}</p>}
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-700">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  )
}

export function InstallHelp() {
  if (isInstalled()) return null
  const phone = phoneType()

  return (
    <details className="rounded-2xl bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4">
        <span className="font-semibold">Add Card Tracker to your home screen</span>
        <span className="text-sm text-slate-500">How?</span>
      </summary>
      <div className="px-4 pb-4">
        <p className="text-sm text-slate-500">
          It opens full screen like an app, with its own icon.
        </p>
        {phone === 'iphone' && <Steps steps={IPHONE_STEPS} />}
        {phone === 'android' && <Steps steps={ANDROID_STEPS} />}
        {phone === 'other' && (
          <>
            <Steps title="iPhone" steps={IPHONE_STEPS} />
            <Steps title="Android" steps={ANDROID_STEPS} />
          </>
        )}
      </div>
    </details>
  )
}

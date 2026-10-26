import { detectInstallMode } from './pwa-env'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
const IPAD_OLD = 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
const IPAD_DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
const MAC = IPAD_DESKTOP_UA

const base = { standaloneDisplay: false, navigatorStandalone: false }

describe('detectInstallMode', () => {
  it('detects iPhone and old-style iPad user agents', () => {
    expect(detectInstallMode({ ...base, userAgent: IPHONE })).toBe('ios')
    expect(detectInstallMode({ ...base, userAgent: IPAD_OLD })).toBe('ios')
  })

  it('detects iPadOS that reports a desktop Mac user agent', () => {
    expect(detectInstallMode({ ...base, userAgent: IPAD_DESKTOP_UA, platform: 'MacIntel', maxTouchPoints: 5 })).toBe('ios')
  })

  it('does not mistake a real Mac or Android for iOS', () => {
    expect(detectInstallMode({ ...base, userAgent: MAC, platform: 'MacIntel', maxTouchPoints: 0 })).toBe('other')
    expect(detectInstallMode({ ...base, userAgent: ANDROID })).toBe('other')
  })

  it('offers nothing once installed (standalone display or iOS navigator.standalone)', () => {
    expect(detectInstallMode({ userAgent: ANDROID, standaloneDisplay: true })).toBe('installed')
    expect(detectInstallMode({ userAgent: IPHONE, standaloneDisplay: false, navigatorStandalone: true })).toBe('installed')
  })
})

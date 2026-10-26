export type InstallMode = 'installed' | 'ios' | 'other'

interface InstallEnv {
  userAgent: string
  /** `(display-mode: standalone)` media query result. */
  standaloneDisplay: boolean
  /** iOS Safari's `navigator.standalone`. */
  navigatorStandalone?: boolean
  platform?: string
  maxTouchPoints?: number
}

/**
 * How the app can be installed here:
 * - 'installed': already running as an installed app, nothing to offer
 * - 'ios': iPhone/iPad, where there is no install API and the user must use Share -> Add to Home Screen
 * - 'other': Chromium-style browsers, where `beforeinstallprompt` drives an install button
 */
export function detectInstallMode(env: InstallEnv): InstallMode {
  if (env.standaloneDisplay || env.navigatorStandalone) return 'installed'
  const iPhoneOrPod = /iPhone|iPod/.test(env.userAgent)
  const iPad = /iPad/.test(env.userAgent) || (env.platform === 'MacIntel' && (env.maxTouchPoints ?? 0) > 1)
  return iPhoneOrPod || iPad ? 'ios' : 'other'
}

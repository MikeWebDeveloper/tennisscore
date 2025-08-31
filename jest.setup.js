import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
  useParams: () => ({}),
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace) => (key) => `${namespace}.${key}`,
  useLocale: () => 'en',
  useNow: () => new Date(),
  useTimeZone: () => 'UTC',
  useFormatter: () => ({
    dateTime: (date) => date.toISOString(),
    number: (num) => num.toString(),
    relativeTime: (date) => 'just now',
  }),
}))

// Mock @/i18n (project's custom i18n)
jest.mock('@/i18n', () => ({
  useTranslations: (namespace) => (key) => `${namespace}.${key}`,
  useLocale: () => 'en',
}))

// Mock Zustand stores
jest.mock('@/stores/matchStore', () => ({
  useMatchStore: jest.fn(() => ({
    currentMatch: null,
    setCurrentMatch: jest.fn(),
    scorePoint: jest.fn(),
    undoLastPoint: jest.fn(),
  })),
}))

jest.mock('@/stores/userStore', () => ({
  useUserStore: jest.fn(() => ({
    user: null,
    setUser: jest.fn(),
    preferences: {},
    setPreferences: jest.fn(),
  })),
}))

// Mock Appwrite
jest.mock('@/lib/appwrite/client', () => ({
  account: {
    get: jest.fn(),
    createSession: jest.fn(),
    deleteSession: jest.fn(),
  },
  databases: {
    listDocuments: jest.fn(),
    createDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
  },
}))

// Mock sound manager
jest.mock('@/lib/sounds', () => ({
  soundManager: {
    getSettings: jest.fn(() => ({
      enabled: true,
      volume: 0.7,
      pointSounds: true,
      criticalPointSounds: true,
      matchEventSounds: true,
    })),
    updateSettings: jest.fn(),
  },
  playSound: jest.fn(),
}))

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})
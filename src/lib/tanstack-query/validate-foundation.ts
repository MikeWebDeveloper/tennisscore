/**
 * Phase 2A Validation Test
 * Quick validation that TanStack Query foundation is properly set up
 */

import { createQueryClient, queryKeys } from './index'

// Test 1: QueryClient creation
const testQueryClient = () => {
  const client = createQueryClient()
  console.log('✅ QueryClient created successfully')
  return client.getDefaultOptions()
}

// Test 2: Query keys structure
const testQueryKeys = () => {
  const playersList = queryKeys.players.list('test-user')
  const matchDetail = queryKeys.matches.detail('test-match-id')
  const liveMatch = queryKeys.matches.live('test-match-id')
  
  console.log('✅ Query keys generated:', {
    playersList,
    matchDetail,
    liveMatch
  })
}

// Test 3: Type exports
const testTypes = () => {
  // This will compile if our types are properly exported
  const testResult: import('./types').ServerActionResult<string> = {
    success: true,
    data: 'test',
  }
  console.log('✅ Types properly exported')
}

export const validateFoundation = () => {
  try {
    testQueryClient()
    testQueryKeys()
    testTypes()
    console.log('🎾 Phase 2A TanStack Query foundation validated successfully!')
    return true
  } catch (error) {
    console.error('❌ Foundation validation failed:', error)
    return false
  }
}

// Auto-run validation in development
if (process.env.NODE_ENV === 'development') {
  validateFoundation()
}
#!/usr/bin/env node

// Test script to verify new super tiebreak match creation and logic
console.log('🎾 Testing New Super Tiebreak Match Creation...')

// Mock the tennis scoring logic to test
const createInitialScore = () => ({
  sets: [],
  games: [0, 0],
  points: [0, 0],
  isTiebreak: false,
  tiebreakPoints: [0, 0],
})

const shouldBeInSuperTiebreak = (score, format) => {
  if (format.finalSetTiebreak !== 'super') return false
  
  const setsToWin = Math.ceil(format.sets / 2)
  const p1SetsWon = score.sets.filter(s => s[0] > s[1]).length
  const p2SetsWon = score.sets.filter(s => s[1] > s[0]).length
  
  // Check if we're in the deciding set
  const isDecidingSet = p1SetsWon === setsToWin - 1 && p2SetsWon === setsToWin - 1
  
  return isDecidingSet && !score.isTiebreak
}

const convertToSuperTiebreak = (score) => ({
  ...score,
  games: [0, 0], // Reset games
  points: [0, 0], // Reset points  
  isTiebreak: true, // Enter tiebreak mode
  tiebreakPoints: [0, 0], // Start tiebreak at 0-0
  initialTiebreakServer: 'p1'
})

// Test scenarios
const testScenarios = [
  {
    name: "New match - should not be super tiebreak yet",
    score: createInitialScore(),
    format: { sets: 3, finalSetTiebreak: 'super' },
    expectedSuperTiebreak: false
  },
  {
    name: "After first set - should not be super tiebreak yet", 
    score: { sets: [[6, 4]], games: [0, 0], points: [0, 0], isTiebreak: false },
    format: { sets: 3, finalSetTiebreak: 'super' },
    expectedSuperTiebreak: false
  },
  {
    name: "Sets 1-1 (deciding set) - should be super tiebreak!",
    score: { sets: [[6, 4], [4, 6]], games: [0, 0], points: [0, 0], isTiebreak: false },
    format: { sets: 3, finalSetTiebreak: 'super' },
    expectedSuperTiebreak: true
  },
  {
    name: "Best of 5, sets 2-2 (deciding set) - should be super tiebreak!",
    score: { sets: [[6, 4], [4, 6], [6, 3], [3, 6]], games: [0, 0], points: [0, 0], isTiebreak: false },
    format: { sets: 5, finalSetTiebreak: 'super' },
    expectedSuperTiebreak: true
  },
  {
    name: "Standard tiebreak format - should never be super tiebreak",
    score: { sets: [[6, 4], [4, 6]], games: [0, 0], points: [0, 0], isTiebreak: false },
    format: { sets: 3, finalSetTiebreak: 'standard' },
    expectedSuperTiebreak: false
  }
]

// Run tests
console.log('🧪 Running Super Tiebreak Detection Tests...\n')

let passed = 0
let failed = 0

testScenarios.forEach((test, index) => {
  const result = shouldBeInSuperTiebreak(test.score, test.format)
  const success = result === test.expectedSuperTiebreak
  
  console.log(`${index + 1}. ${test.name}`)
  console.log(`   Score: Sets=${JSON.stringify(test.score.sets)}, Games=${JSON.stringify(test.score.games)}`)
  console.log(`   Format: ${test.format.sets} sets, finalSetTiebreak="${test.format.finalSetTiebreak}"`)
  console.log(`   Expected: ${test.expectedSuperTiebreak}, Got: ${result}`)
  
  if (success) {
    console.log(`   ✅ PASS\n`)
    passed++
  } else {
    console.log(`   ❌ FAIL\n`)
    failed++
  }
})

// Test super tiebreak conversion
console.log('🔄 Testing Super Tiebreak Conversion...')
const decidingSetScore = { sets: [[6, 4], [4, 6]], games: [2, 1], points: [1, 2], isTiebreak: false }
const convertedScore = convertToSuperTiebreak(decidingSetScore)

console.log('Original Score:', decidingSetScore)
console.log('Converted Score:', convertedScore)

const conversionCorrect = 
  convertedScore.isTiebreak === true &&
  convertedScore.tiebreakPoints[0] === 0 &&
  convertedScore.tiebreakPoints[1] === 0 &&
  convertedScore.games[0] === 0 &&
  convertedScore.games[1] === 0

console.log(`Conversion ${conversionCorrect ? '✅ PASSED' : '❌ FAILED'}`)

if (conversionCorrect) passed++
else failed++

// Summary
console.log('\n📊 Summary:')
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`)

if (failed === 0) {
  console.log('\n🎉 All tests passed! Super tiebreak logic is working correctly.')
} else {
  console.log('\n⚠️  Some tests failed. Please review the logic.')
  process.exit(1)
} 
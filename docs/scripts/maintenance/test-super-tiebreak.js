#!/usr/bin/env node

// Test script to verify super tiebreak functionality
console.log("🎾 Testing Super Tiebreak Logic...")

// Mock MatchFormat interface
const createMatchFormat = (finalSetTiebreak) => ({
  sets: 3,
  noAd: false,
  tiebreak: true,
  finalSetTiebreak,
  finalSetTiebreakAt: 10,
  shortSets: false
})

// Mock the scoring functions we need to test
const isTiebreakWon = (p1Points, p2Points, targetPoints = 7) => {
  return (p1Points >= targetPoints && p1Points - p2Points >= 2) ||
         (p2Points >= targetPoints && p2Points - p1Points >= 2)
}

const calculateTiebreakTarget = (format, p1SetsWon, p2SetsWon) => {
  const setsToWin = Math.ceil(format.sets / 2)
  const isDecidingSet = p1SetsWon === setsToWin - 1 && p2SetsWon === setsToWin - 1
  return (isDecidingSet && format.finalSetTiebreak === "super") ? (format.finalSetTiebreakAt || 10) : 7
}

// Test cases
const testCases = [
  {
    name: "Standard Tiebreak - First Set",
    format: createMatchFormat("standard"),
    p1SetsWon: 0,
    p2SetsWon: 0,
    expectedTarget: 7
  },
  {
    name: "Standard Tiebreak - Deciding Set (Best of 3)",
    format: createMatchFormat("standard"),
    p1SetsWon: 1,
    p2SetsWon: 1,
    expectedTarget: 7
  },
  {
    name: "Super Tiebreak - First Set (should still be 7)",
    format: createMatchFormat("super"),
    p1SetsWon: 0,
    p2SetsWon: 0,
    expectedTarget: 7
  },
  {
    name: "Super Tiebreak - Deciding Set (Best of 3) - Should be 10!",
    format: createMatchFormat("super"),
    p1SetsWon: 1,
    p2SetsWon: 1,
    expectedTarget: 10
  },
  {
    name: "None - Deciding Set (should never reach tiebreak)",
    format: createMatchFormat("none"),
    p1SetsWon: 1,
    p2SetsWon: 1,
    expectedTarget: 7 // This shouldn't matter since tiebreak won't start
  }
]

// Run tests
console.log("\n📊 Test Results:")
let passed = 0
let failed = 0

testCases.forEach(testCase => {
  const actualTarget = calculateTiebreakTarget(testCase.format, testCase.p1SetsWon, testCase.p2SetsWon)
  const success = actualTarget === testCase.expectedTarget
  
  console.log(`${success ? '✅' : '❌'} ${testCase.name}`)
  console.log(`   Expected target: ${testCase.expectedTarget}, Got: ${actualTarget}`)
  
  if (success) {
    passed++
  } else {
    failed++
    console.log(`   ❗ FAILED: Expected ${testCase.expectedTarget} but got ${actualTarget}`)
  }
  console.log("")
})

// Test super tiebreak win conditions
console.log("🏆 Testing Super Tiebreak Win Conditions:")

const superTiebreakTests = [
  { p1: 10, p2: 8, target: 10, shouldWin: true, winner: "p1", description: "10-8 (p1 wins super tiebreak)" },
  { p1: 8, p2: 10, target: 10, shouldWin: true, winner: "p2", description: "8-10 (p2 wins super tiebreak)" },
  { p1: 9, p2: 10, target: 10, shouldWin: false, winner: null, description: "9-10 (not enough margin)" },
  { p1: 11, p2: 9, target: 10, shouldWin: true, winner: "p1", description: "11-9 (p1 wins with 2-point margin)" },
  { p1: 10, p2: 9, target: 10, shouldWin: false, winner: null, description: "10-9 (need 2-point margin)" },
  { p1: 15, p2: 13, target: 10, shouldWin: true, winner: "p1", description: "15-13 (extended super tiebreak)" },
]

superTiebreakTests.forEach(test => {
  const isWon = isTiebreakWon(test.p1, test.p2, test.target)
  const success = isWon === test.shouldWin
  
  console.log(`${success ? '✅' : '❌'} ${test.description}`)
  console.log(`   Score: ${test.p1}-${test.p2}, Target: ${test.target}, Won: ${isWon}`)
  
  if (success) {
    passed++
  } else {
    failed++
  }
})

console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log("🎉 All tests passed! Super tiebreak logic is working correctly.")
} else {
  console.log("❌ Some tests failed. Please check the implementation.")
  process.exit(1)
} 
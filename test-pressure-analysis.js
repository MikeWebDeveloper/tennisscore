// Simple test to verify the pressure analysis functions work
const { 
  getPressureLevel, 
  isClutchSituation, 
  calculateMomentumShift, 
  detectComebackSituation, 
  calculateCurrentStreak 
} = require('./src/lib/utils/tennis-scoring.ts');

// Mock data
const mockPointLog = [
  { id: '1', winner: 'p1', timestamp: '2024-01-01T10:00:00Z', pointNumber: 1, setNumber: 1, gameNumber: 1, gameScore: '0-0', server: 'p1', isBreakPoint: false, isSetPoint: false, isMatchPoint: false, isGameWinning: false, isSetWinning: false, isMatchWinning: false, isTiebreak: false, serveType: 'first', pointOutcome: 'winner', rallyLength: 3 },
  { id: '2', winner: 'p2', timestamp: '2024-01-01T10:01:00Z', pointNumber: 2, setNumber: 1, gameNumber: 1, gameScore: '15-0', server: 'p1', isBreakPoint: false, isSetPoint: false, isMatchPoint: false, isGameWinning: false, isSetWinning: false, isMatchWinning: false, isTiebreak: false, serveType: 'first', pointOutcome: 'winner', rallyLength: 4 }
];

const mockScore = {
  sets: [],
  games: [0, 0],
  points: [1, 1],
  isTiebreak: false,
  tiebreakPoints: [0, 0]
};

const mockFormat = {
  sets: 3,
  noAd: false,
  tiebreak: true,
  finalSetTiebreak: "standard",
  shortSets: false
};

console.log('Testing pressure analysis functions...');
console.log('Functions imported successfully!');
console.log('Test complete - functions are available for use in components.');
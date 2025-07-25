# Enhanced Pressure Analysis Functions - Usage Examples

The following functions have been added to `/src/lib/utils/tennis-scoring.ts`:

## Functions Added

### 1. `getPressureLevel(pointLog, currentScore, format): PressureAnalysis`
Calculates pressure level (1-5) based on game situation, set status, and recent momentum.

### 2. `isClutchSituation(pointLog, currentScore, format): ClutchSituation`
Detects clutch scenarios with different types and levels.

### 3. `calculateMomentumShift(pointLog, lookbackPoints = 8): MomentumShift`
Analyzes momentum changes based on recent point patterns.

### 4. `detectComebackSituation(pointLog, currentScore, format): ComebackSituation`
Identifies comeback scenarios.

### 5. `calculateCurrentStreak(pointLog, analysisWindow = 20): StreakAnalysis`
Tracks point streaks and analyzes recent form.

## Usage Example

```typescript
import { 
  getPressureLevel, 
  isClutchSituation, 
  calculateMomentumShift, 
  detectComebackSituation, 
  calculateCurrentStreak 
} from '@/lib/utils/tennis-scoring';

// Example usage in a component
const match = useMatchStore(state => state.currentMatch);

if (match) {
  const pressureAnalysis = getPressureLevel(
    match.pointLog, 
    match.score, 
    match.matchFormat
  );
  
  const clutchSituation = isClutchSituation(
    match.pointLog, 
    match.score, 
    match.matchFormat
  );
  
  const momentumShift = calculateMomentumShift(match.pointLog);
  
  const comebackSituation = detectComebackSituation(
    match.pointLog, 
    match.score, 
    match.matchFormat
  );
  
  const streakAnalysis = calculateCurrentStreak(match.pointLog);
  
  console.log('Pressure Level:', pressureAnalysis.level, pressureAnalysis.description);
  console.log('Clutch Situation:', clutchSituation.isClutch ? clutchSituation.type : 'None');
  console.log('Momentum Shift:', momentumShift.hasShifted ? momentumShift.direction : 'None');
  console.log('Comeback:', comebackSituation.isComeback ? comebackSituation.description : 'None');
  console.log('Current Streak:', streakAnalysis.currentStreak.length, 'points for', streakAnalysis.currentStreak.player);
}
```

## Return Types

Each function returns detailed analysis objects with comprehensive information:

- **PressureAnalysis**: level (1-5), factors array, description
- **ClutchSituation**: isClutch boolean, type, level (1-5), description, affectedPlayer
- **MomentumShift**: hasShifted boolean, direction, intensity (1-5), description, triggerPoints
- **ComebackSituation**: isComeback boolean, type, player, deficit, description  
- **StreakAnalysis**: currentStreak, longestPointStreak, recentForm stats

These functions integrate seamlessly with the existing tennis scoring system and can be used in enhanced statistics components for deeper match analysis.
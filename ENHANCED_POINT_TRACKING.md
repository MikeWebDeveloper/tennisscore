# Enhanced Point-by-Point Data Collection

This document describes the enhanced contextual data collection system implemented in the match store for advanced tennis statistics.

## Overview

The match store has been enhanced to capture rich contextual information for each point played, enabling advanced statistics and analytics while maintaining backward compatibility with existing matches.

## Enhanced Data Fields

### Pressure Context
- **Level**: 1-5 scale indicating pressure intensity
- **Factors**: Array of contributing pressure factors
- **Description**: Human-readable pressure analysis

### Clutch Situations
- **Type**: break_point, set_point, match_point, comeback, tiebreak, deciding_set
- **Level**: 1-5 intensity scale
- **Affected Player**: Which player is under pressure
- **Description**: Situation description

### Enhanced Serve Data
- **Placement**: wide, body, t, long, net
- **Quality**: 1-5 scale (1=poor, 5=excellent)
- **Spin**: flat, slice, kick, twist
- **Speed**: mph or km/h
- **Bounce Height**: low, medium, high
- **Effectiveness**: weak, neutral, strong

### Enhanced Return Data
- **Quality**: defensive, neutral, offensive
- **Placement**: 9-zone court positioning system
- **Type**: block, swing, slice, defensive, attack
- **Depth**: short, medium, deep
- **Direction**: cross-court, down-the-line, inside-out, inside-in
- **Effectiveness**: weak, neutral, strong

### Rally Characteristics
- **Type**: baseline, serve-and-volley, net-play, defensive, power-baseline, mixed
- **Character**: aggressive, defensive, neutral, counter-attacking, grinding
- **Key Shots**: Array of significant shots with effectiveness ratings
- **Dominant Player**: p1, p2, balanced
- **Net Approaches**: Count of net approaches
- **Change of Pace**: Boolean indicator

### Momentum Context
- **Shift**: Momentum shift analysis with direction and intensity
- **Current Streak**: Active point/game/set streaks
- **Game Changer**: Boolean indicator for pivotal points
- **Momentum Direction**: p1, p2, neutral
- **Emotional Tone**: high-energy, tense, routine, deflating, momentum-shifting

### Tactical Context
- **Approach Shot**: Boolean indicator
- **Net Position**: Boolean indicator
- **Pressure Situation**: Boolean indicator
- **Tactical Importance**: 1-5 scale
- **Game State**: routine, important, crucial, decisive
- **Set Context**: early, middle, late, decisive
- **Match Context**: early, middle, late, decisive

### Match Conditions (Optional)
- **Fatigue Levels**: 1-5 scale for each player
- **Weather**: condition, wind strength/direction
- **Surface**: type, speed, condition
- **Time**: match/set/game duration tracking

## Implementation Details

### Helper Functions

#### `calculateEnhancedContext()`
Calculates all contextual data for a point using existing tennis-scoring utilities:
- Integrates with pressure level detection
- Analyzes clutch situations
- Calculates momentum shifts
- Determines tactical importance

#### `enhanceServeData()`
Enhances basic serve information with quality assessment:
- Analyzes serve outcomes
- Assigns quality ratings
- Determines effectiveness

#### `enhanceReturnData()`
Enhances return information when receiver wins point:
- Analyzes return effectiveness
- Assigns quality ratings
- Determines placement patterns

#### `enhanceRallyCharacteristics()`
Analyzes rally patterns based on length and outcomes:
- Determines rally type and character
- Identifies key tactical elements
- Tracks net play frequency

### Backward Compatibility

#### `normalizePointDetail()`
Ensures existing point data works with enhanced interface:
- Provides default values for missing fields
- Maintains type safety
- Handles legacy data gracefully

#### `hasEnhancedData()`
Checks if a point contains enhanced contextual data

#### `getMatchDataEnhancementLevel()`
Returns enhancement level: 'basic', 'partial', or 'enhanced'

## Usage Examples

### Basic Point Award (Automatic Enhancement)
```typescript
matchStore.awardPoint('p1', {
  serveType: 'first',
  pointOutcome: 'winner',
  rallyLength: 3
})
```

### Detailed Point Award
```typescript
matchStore.awardPoint('p1', {
  serveType: 'first',
  pointOutcome: 'winner',
  rallyLength: 5,
  enhancedServeData: {
    placement: 'wide',
    quality: 4,
    spin: 'slice',
    speed: 115
  },
  enhancedReturnData: {
    quality: 'offensive',
    placement: 'deuce-deep',
    type: 'attack'
  },
  rallyCharacteristics: {
    type: 'baseline',
    character: 'aggressive',
    netApproaches: 1
  },
  matchConditions: {
    fatigue: { p1Level: 2, p2Level: 3 },
    weather: { condition: 'windy', windStrength: 'moderate' }
  }
})
```

### Accessing Enhanced Data
```typescript
const point = matchStore.pointLog[0]
if (point.pressureContext) {
  console.log(`Pressure level: ${point.pressureContext.level}`)
  console.log(`Factors: ${point.pressureContext.factors.join(', ')}`)
}

if (point.clutchSituation?.isClutch) {
  console.log(`Clutch situation: ${point.clutchSituation.type}`)
}

if (point.momentumContext?.isGameChanger) {
  console.log('This was a game-changing point!')
}
```

## Benefits

1. **Rich Analytics**: Enables advanced performance analysis
2. **Contextual Understanding**: Provides deeper insights into match dynamics
3. **Progressive Enhancement**: Works with existing data, enhances new data
4. **Flexible Collection**: Optional fields allow for varying levels of detail
5. **Automatic Analysis**: Intelligent defaults based on basic point data
6. **Backward Compatible**: Existing matches continue to work seamlessly

## Integration Points

- **Statistics Dashboard**: Enhanced data powers advanced analytics
- **Match Analysis**: Contextual information improves insights
- **Performance Tracking**: Pressure and clutch analysis
- **Coaching Tools**: Tactical pattern recognition
- **Player Development**: Weakness identification and improvement tracking

The enhanced point tracking system provides a solid foundation for advanced tennis analytics while maintaining the simplicity and reliability of the existing match scoring system.
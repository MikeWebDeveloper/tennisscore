# Tennis Scoring System - Complete Reference

## Overview
Tennis matches are comprised of **Points**, **Games**, **Sets**, and **Matches**. The unique scoring system differs significantly from most other sports, with complex statistical tracking for professional analysis.

## Point Scoring within a Game

### Basic Point Values
- **0 points = "Love"**
- **1 point = "15"** 
- **2 points = "30"**
- **3 points = "40"**
- **4+ points = "Game"** (if leading by 2+ points or winning from advantage)

### Standard Game Flow
1. Game starts at 0-0 ("Love-Love")
2. First point: 15-0 or 0-15 (depending on who wins)
3. Second point: 30-0, 15-15, or 0-30
4. Third point: 40-0, 30-15, 15-30, or 0-40
5. Fourth point: Game won OR deuce situation

### Deuce Rules
- **Deuce**: When both players reach 40 (40-40)
- **Advantage**: Player who wins next point after deuce
  - "Ad-In" = Server has advantage
  - "Ad-Out" = Receiver has advantage  
- **Game Win**: Player with advantage wins next point
- **Back to Deuce**: Player without advantage wins next point

### Critical Rule: Two-Point Margin Required
A player must win a game by **at least 2 points**. This is why deuce exists - if both players reach 40, one must win 2 consecutive points to win the game.

## Set Scoring

### Standard Set Rules
- **6 games minimum** to win a set
- **Must win by 2 games** (e.g., 6-4, 7-5, 8-6)
- If tied 6-6, typically goes to **tiebreak**

### Tiebreak Game (played at 6-6)
- Uses **numerical scoring** (1, 2, 3, etc.) instead of 15-30-40
- **First to 7 points** wins tiebreak
- **Must win by 2 points** (can go 8-6, 9-7, 10-8, etc.)
- Winner of tiebreak wins set 7-6

### Alternative Set Formats
- **Advantage Set**: No tiebreak at 6-6, continues until 2-game margin
- **Pro Sets**: First to 8 or 9 games (used in some amateur/practice matches)

## Match Scoring

### Standard Formats
- **Best of 3 Sets**: First to win 2 sets (most common)
- **Best of 5 Sets**: First to win 3 sets (men's Grand Slams)

### Match Examples
- 6-4, 6-2 (straight sets, 2-0)
- 6-4, 3-6, 6-2 (three sets, 2-1)
- 7-6(7-4), 6-3 (first set to tiebreak, won 7-4)

## Serving Rules

### Service Rotation
- **Same player serves entire game**
- **Service alternates each game**
- After odd-numbered games (1st, 3rd, 5th, etc.), players **switch ends**

### Tiebreak Serving
- Player who would serve next starts tiebreak
- Serves **1 point**, then opponent serves **2 points**
- Continue alternating **2 serves** each
- Switch ends every **6 points** (at 6-0, 6-2, 6-4, etc.)

## Tennis Statistics - Definitions and Attribution

### Winner Statistics

#### Winners
**Definition**: If Player A hits the ball & Player B is unable to touch it with their racquet before the ball bounces twice, then it's a Winner for Player A.
- **Attribution**: Credited to the player who hit the winning shot
- **Objectivity**: This statistic is very objective and straightforward

#### Aces
**Definition**: A serve that the receiver cannot touch with their racquet (Service Winner)
- **Attribution**: Always credited to the server
- **Professional Rates**: Aces account for ~16% of ATP Tour first serve effectiveness
- **Note**: Aces are counted as winners in overall winner statistics

### Error Statistics

#### Unforced Errors
**Definition**: Error made when a player has ample time and position to play the shot but sends it out or into the net
- **Attribution**: Credited to the player who made the error (LOST the point)
- **Subjectivity**: Purely subjective decision by match officials/statisticians
- **Professional Rates**: ~8.0% error rate on ATP, ~8.6% on WTA
- **Tennis Logic**: CRITICAL - If Player A wins a point by unforced error, the error is attributed to Player B (who lost)

#### Forced Errors
**Definition**: Error made when a player is under pressure (on the run, poor court position) and sends the shot out or into the net
- **Attribution**: Credited to the player who made the error (LOST the point)
- **Causation**: Can also be credited to the player who forced the error in some systems
- **Subjectivity**: Highly subjective - requires judgment about time pressure and court position

#### Double Faults
**Definition**: When server misses both first and second serve attempts
- **Attribution**: Always credited to the server
- **Point Award**: Point awarded to receiver
- **Frequency**: Median of 2-3 double faults per match in professional tennis

### Serve Statistics

#### First Serve Percentage
**Definition**: Percentage of first serve attempts that land in the service box
- **Professional Average**: Varies by player, but top players typically 60-70%
- **Strategy**: Higher percentage often means more conservative serving

#### Serve Effectiveness
**Definition**: Percentage of points where serve creates an advantage
- **ATP Average**: 58% on first serve, 23% on second serve
- **Components**: Includes aces (16%), unreturned serves (22%), attacking first ball (20%)

#### Serve Speed
**Definition**: Velocity of the serve measured by radar
- **Men's Record**: 263.4 km/h (163.7 mph) by Sam Groth
- **ATP Record**: 253.0 km/h (157.0 mph) by John Isner
- **Note**: WTA doesn't maintain official serve speed rankings consistently

### Return and Break Point Statistics

#### Break Points
**Definition**: Opportunity for the receiver to win a game on the opponent's serve
- **Occurs At**: 30-40, 15-40, 0-40, or advantage to receiver
- **Types**: Single (30-40), Double (15-40), Triple (0-40) break points
- **Critical Metric**: Return games with break opportunities won (more meaningful than conversion %)

#### Break Point Conversion
**Definition**: Percentage of break point opportunities successfully converted
- **Alternative Metric**: "Return games with break opportunities won" provides better insight
- **Match Impact**: Successful breaks often determine set outcomes

### Rally and Court Position Statistics

#### Rally Length
**Definition**: Number of shots in a point from serve to point end
- **Most Common**: 1 shot (~30% of points - aces/service winners)
- **Professional Average**: Men 3.8 shots, Women 3.9 shots per rally
- **Key Insight**: 59% (men) and 62% (women) of points end within first 4 shots
- **First 4 Shots**: Serve, return, serve+1, return+1 (most critical for match outcome)

#### Court Positioning
**Definition**: Location of player when hitting shots
- **Offensive Zone**: When opponent's ball bounces in service zone or middle zone
- **Net Position**: Extremely high percentage for winning points
- **Surface Impact**: Clay has more short rallies than commonly believed

### Advanced Modern Analytics

#### Pressure Points
**Definition**: Points played at crucial score situations (deuce, break point, set point)
- **ATP Average**: 1.61 pressure points per service game
- **WTA Average**: 2.31 pressure points per service game (43.5% higher)
- **Surface Variation**: Most frequent on clay, least on grass

#### Dominance Ratio (DR)
**Definition**: Comprehensive metric incorporating point winning and clutch performance
- **DR+**: Dominance Ratio multiplied by Balanced Leverage Ratio
- **Components**: Points Dominance Ratio, Games Dominance Ratio
- **Purpose**: Measures overall match control beyond simple point counts

#### Serve Plus One
**Definition**: Analysis of serve and immediate next shot effectiveness
- **Critical Pattern**: Serve → Return → Serve+1 → Return+1
- **Match Impact**: Most practiced shots that matter most for winning
- **Strategy**: Front-loading points in first 4 shots

## Statistical Attribution Rules (CRITICAL)

### Error Attribution Logic
**Tennis Law**: A player CANNOT make an error and win the same point
- If point outcome = "unforced_error" AND winner = "Player A", then error player = "Player B"
- If point outcome = "forced_error" AND winner = "Player A", then error player = "Player B"
- **Data Validation**: lastShotPlayer should NEVER equal winner for error outcomes

### Winner Attribution Logic
- If point outcome = "winner" AND winner = "Player A", then lastShotPlayer = "Player A"
- If point outcome = "ace" AND winner = "Player A", then lastShotPlayer = "Player A" (server)

### Statistical Calculation Formula
```typescript
// For errors: Error player is always the LOSER of the point
if (pointOutcome === 'unforced_error' || pointOutcome === 'forced_error') {
  errorPlayer = (winner === 'p1') ? 'p2' : 'p1'  // Error goes to loser
  stats[errorType][errorPlayer === 'p1' ? 0 : 1]++
}

// For winners: Winner is the player who hit the shot
if (pointOutcome === 'winner' || pointOutcome === 'ace') {
  stats[winnerType][winner === 'p1' ? 0 : 1]++
}
```

## Implementation for TennisScore App

### Detail Level System

#### Points Only Mode
- **Store**: Point winner, server, basic score progression
- **Available Stats**: Service points won/lost, break points, games won
- **No Storage**: Shot types, error classifications, rally details

#### Simple Mode
- **Store**: Points Only + point outcomes (ace, winner, forced/unforced error, double fault)
- **Available Stats**: All Points Only stats + winner/error counts by type
- **Serve Stats**: First/second serve tracking, serve type effectiveness

#### Detailed Mode
- **Store**: Simple Mode + shot directions, court positions, rally length
- **Available Stats**: All Simple stats + positional analysis, rally patterns
- **Advanced Metrics**: Shot direction analysis, court positioning effectiveness

#### Custom Mode
- **Store**: User-selected combination of all available metrics
- **Available Stats**: Fully customizable based on data collection choices
- **Future**: AI-powered insights, pressure point analysis

### Point Storage Format
```json
{
  "pointNumber": 1,
  "timestamp": "2024-01-01T10:00:00Z",
  "winner": "p1",                    // Who won the point
  "server": "p1",                    // Who was serving
  "serveType": "first",              // first | second
  "pointOutcome": "unforced_error",  // ace | winner | forced_error | unforced_error | double_fault
  "lastShotPlayer": "p2",            // Who hit the last shot (CRITICAL: for errors = error player)
  "lastShotType": "forehand",        // Type of last shot
  "rallyLength": 3,                  // Number of shots in rally
  "gameScore": "15-30",              // Score display at time of point
  "isBreakPoint": true,              // Was this a break point?
  "isSetPoint": false,               // Was this a set point?
  "isMatchPoint": false,             // Was this a match point?
  "courtPosition": "baseline",       // Where last shot was hit from
  "shotDirection": "cross_court",    // Direction of last shot
  "notes": "Great defensive shot"    // Optional notes
}
```

### Key Calculations for App

#### Score Progression Logic
1. **Point won**: Update tennis points (0→15→30→40→Game or Deuce logic)
2. **Game won**: Reset points to 0-0, increment game count, check set win
3. **Set won**: Reset games, increment set count, check match win
4. **Serve rotation**: Switch server after each game
5. **End switching**: Switch ends after odd total games

#### Statistical Calculations
- Convert tennis points (0,1,2,3+) to display (Love,15,30,40,Ad)
- Determine if game is at deuce
- Calculate if point is game/set/match point
- Track serving player correctly
- Handle tiebreak scoring differently
- Validate error attribution logic

#### Data Validation Rules
- Verify lastShotPlayer ≠ winner for error outcomes
- Ensure point outcomes match tennis logic
- Validate serve types match serving patterns
- Check rally length matches shot count

### Professional Tennis Integration

#### ATP/WTA Standards
- Follow official ATP/WTA statistical definitions
- Implement subjective error classification guidelines
- Support multiple scoring formats (standard, no-ad, super tiebreaks)
- Include pressure point identification

#### Modern Analytics Support
- Calculate dominance ratios for advanced users
- Track serve plus one effectiveness
- Analyze rally pattern distributions
- Support pressure point analysis

## Best Practices for Implementation

### Data Collection
1. **Progressive Enhancement**: Collect more data as detail level increases
2. **Backward Compatibility**: Ensure older matches remain functional
3. **Real-time Validation**: Check data consistency during input
4. **Error Recovery**: Provide undo functionality for incorrect entries

### Statistical Display
1. **Contextual Information**: Show what each statistic means
2. **Drill-down Capability**: Allow detailed exploration of statistics
3. **Comparative Analysis**: Compare to professional averages when relevant
4. **Visual Representation**: Use charts and graphs for complex statistics

### User Experience
1. **Clear Attribution**: Make it obvious who gets credited with each statistic
2. **Educational Content**: Explain tennis statistics to casual users
3. **Professional Mode**: Provide detailed analytics for serious players
4. **Mobile Optimization**: Ensure statistics work well on small screens

This comprehensive system ensures consistent tennis scoring and statistical tracking throughout the TennisScore application, following professional standards while accommodating different levels of detail collection.
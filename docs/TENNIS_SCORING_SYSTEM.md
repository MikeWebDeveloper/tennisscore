# Tennis Scoring System - Complete Reference

## Overview
Tennis matches are comprised of **Points**, **Games**, **Sets**, and **Matches**. The unique scoring system differs significantly from most other sports.

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

## Score Announcement Rules

### Format: Server's Score First
- "15-30" means server has 15, receiver has 30
- "40-Love" means server has 40, receiver has 0
- "Deuce" when both have 40
- "Advantage [Player Name]" or "Ad-In"/"Ad-Out"

## Common Terms

### Love
- Means "zero" or "no points"
- Possibly from French "l'œuf" (the egg) - shape of zero

### All
- Used when scores are tied: "30-All", "5-All"
- Exception: 40-40 is called "Deuce", not "40-All"

### Game Point
- When a player is one point away from winning the game
- Can occur at 40-0, 40-15, 40-30, or on advantage

### Break Point  
- When the receiving player is one point away from winning the service game
- Significant because holding serve is expected

### Set Point
- When a player is one point away from winning the set

### Match Point
- When a player is one point away from winning the entire match

## Special Situations

### Double Fault
- When server misses both first and second serve
- Point awarded to receiver

### Ace
- Serve that receiver cannot touch or return
- Point awarded to server

### Let
- Ball touches net but lands in correct service box
- Point is replayed

## Implementation Notes for TennisScore App

### Point Storage Format
For each point in pointLog, we need:
```json
{
  "pointNumber": 1,
  "gameScore": {"p1": 0, "p2": 1}, // Tennis points (0, 15, 30, 40, Ad)
  "setScore": {"p1": 0, "p2": 0},   // Games won in current set
  "matchScore": {"p1": 0, "p2": 0}, // Sets won in match
  "server": "p1",                   // Who was serving
  "winner": "p2",                   // Who won the point
  "pointType": "Winner",            // How point was won
  "shotType": "Forehand"            // Last shot type
}
```

### Score Progression Logic
1. **Point won**: Update tennis points (0→15→30→40→Game or Deuce logic)
2. **Game won**: Reset points to 0-0, increment game count, check set win
3. **Set won**: Reset games, increment set count, check match win
4. **Serve rotation**: Switch server after each game
5. **End switching**: Switch ends after odd total games

### Key Calculations Needed
- Convert tennis points (0,1,2,3+) to display (Love,15,30,40,Ad)
- Determine if game is at deuce
- Calculate if point is game/set/match point
- Track serving player correctly
- Handle tiebreak scoring differently

This comprehensive system ensures consistent tennis scoring throughout the TennisScore application. 
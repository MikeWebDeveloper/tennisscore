#!/usr/bin/env node

// Script to fix match 6861c99c001d2b98ee65 that should be in super tiebreak
import { Client, Databases } from 'node-appwrite'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY)

const databases = new Databases(client)

const MATCH_ID = '6861c99c001d2b98ee65'
const DATABASE_ID = 'tennisscore_db'
const COLLECTION_ID = 'matches'

async function fixSuperTiebreakMatch() {
  console.log('🎾 Fixing Super Tiebreak Match...')
  
  try {
    // Get the current match
    const match = await databases.getDocument(DATABASE_ID, COLLECTION_ID, MATCH_ID)
    console.log('📖 Current match score:', match.score)
    console.log('📖 Current match format:', match.matchFormat)
    
    // Parse current data
    const currentScore = JSON.parse(match.score)
    const matchFormat = JSON.parse(match.matchFormat)
    
    console.log('📊 Current state:')
    console.log('  - Sets:', currentScore.sets)
    console.log('  - Games:', currentScore.games)
    console.log('  - Points:', currentScore.points)
    console.log('  - isTiebreak:', currentScore.isTiebreak)
    console.log('  - finalSetTiebreak:', matchFormat.finalSetTiebreak)
    
    // Check if this should be a super tiebreak
    const p1SetsWon = currentScore.sets.filter(s => s[0] > s[1]).length
    const p2SetsWon = currentScore.sets.filter(s => s[1] > s[0]).length
    const setsToWin = Math.ceil(matchFormat.sets / 2)
    const isDecidingSet = p1SetsWon === setsToWin - 1 && p2SetsWon === setsToWin - 1
    
    console.log('🔍 Analysis:')
    console.log('  - P1 sets won:', p1SetsWon)
    console.log('  - P2 sets won:', p2SetsWon)
    console.log('  - Sets to win:', setsToWin)
    console.log('  - Is deciding set:', isDecidingSet)
    console.log('  - Should be super tiebreak:', isDecidingSet && matchFormat.finalSetTiebreak === 'super')
    
    if (isDecidingSet && matchFormat.finalSetTiebreak === 'super' && !currentScore.isTiebreak) {
      console.log('✅ This match should be in a super tiebreak!')
      
      // Convert the current 3rd set games to super tiebreak points
      // Current: games [0, 3] means P2 has won 3 games
      // In super tiebreak: this translates to P2 having 3 points
      const newScore = {
        sets: currentScore.sets, // Keep existing sets: [[6,0],[0,6]]
        games: [0, 0], // Reset games for tiebreak
        points: [0, 0], // Reset regular points
        isTiebreak: true, // Now in tiebreak
        tiebreakPoints: [currentScore.games[0], currentScore.games[1]], // Convert games to tiebreak points
        initialTiebreakServer: 'p1' // Assume P1 started serving the deciding set
      }
      
      console.log('🔄 Converting to super tiebreak:')
      console.log('  - New score:', newScore)
      
      // Update the match
      const updatedMatch = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        MATCH_ID,
        {
          score: JSON.stringify(newScore)
        }
      )
      
      console.log('✅ Match updated successfully!')
      console.log('📊 New score:', updatedMatch.score)
      
      // Also need to update point log to reflect this change
      // The last few points should be marked as tiebreak points
      const pointLog = match.pointLog || []
      if (pointLog.length > 0) {
        console.log('📝 Point log has', pointLog.length, 'points')
        
        // Find points from set 3 and mark them as tiebreak
        const updatedPointLog = pointLog.map((pointStr, index) => {
          const point = JSON.parse(pointStr)
          if (point.setNumber === 3) {
            // This point should be part of the super tiebreak
            return JSON.stringify({
              ...point,
              isTiebreak: true,
              gameScore: `${point.pointNumber - 48}-${Math.max(0, index - point.pointNumber + 1)}` // Rough conversion
            })
          }
          return pointStr
        })
        
        // Update point log
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTION_ID,
          MATCH_ID,
          {
            pointLog: updatedPointLog
          }
        )
        
        console.log('✅ Point log updated!')
      }
      
    } else {
      console.log('ℹ️  Match is already in correct state or does not need super tiebreak')
    }
    
  } catch (error) {
    console.error('❌ Error fixing match:', error.message)
  }
}

// Run the script
fixSuperTiebreakMatch().then(() => {
  console.log('🏁 Script completed')
  process.exit(0)
}).catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
}) 
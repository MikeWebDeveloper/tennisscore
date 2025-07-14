#!/usr/bin/env node
/**
 * Data Migration Script to Fix Corrupted Player IDs
 * 
 * This script fixes matches where player IDs were corrupted by having 
 * player names concatenated to them.
 */

const { Client, Databases } = require("node-appwrite");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Create admin client
function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_API_KEY);

  return {
    databases: new Databases(client),
  };
}

// Extract clean player ID from corrupted ID
function extractPlayerId(corruptedId) {
  if (!corruptedId || typeof corruptedId !== 'string') {
    return corruptedId;
  }
  
  // If it contains a space, take only the first part (the actual ID)
  if (corruptedId.includes(' ')) {
    return corruptedId.split(' ')[0];
  }
  
  return corruptedId;
}

// Verify that a player ID exists and get player data
async function verifyPlayer(databases, playerId) {
  if (!playerId || playerId.startsWith('anonymous-')) {
    return { exists: true, player: null }; // Anonymous players don't need verification
  }
  
  try {
    const player = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID,
      playerId
    );
    return { exists: true, player };
  } catch (error) {
    return { exists: false, player: null, error: error.message };
  }
}

// Create embedded player data for a player
function createEmbeddedPlayerData(player) {
  if (!player) return null;
  
  return {
    firstName: player.firstName,
    lastName: player.lastName,
    $id: player.$id
  };
}

// Fix a single match
async function fixMatch(databases, match, dryRun = true) {
  console.log(`\n🔧 ${dryRun ? 'ANALYZING' : 'FIXING'} Match ${match.$id}`);
  console.log('─'.repeat(50));
  
  const originalPlayerIds = {
    playerOne: match.playerOneId,
    playerTwo: match.playerTwoId,
    playerThree: match.playerThreeId,
    playerFour: match.playerFourId
  };
  
  // Extract clean IDs
  const cleanPlayerIds = {
    playerOne: extractPlayerId(match.playerOneId),
    playerTwo: extractPlayerId(match.playerTwoId),
    playerThree: extractPlayerId(match.playerThreeId),
    playerFour: extractPlayerId(match.playerFourId)
  };
  
  let needsUpdate = false;
  let updateData = {};
  
  // Check each player ID
  for (const [key, originalId] of Object.entries(originalPlayerIds)) {
    if (!originalId) continue;
    
    const cleanId = cleanPlayerIds[key.replace('player', '').toLowerCase() === 'one' ? 'playerOne' : 
                                     key.replace('player', '').toLowerCase() === 'two' ? 'playerTwo' :
                                     key.replace('player', '').toLowerCase() === 'three' ? 'playerThree' : 'playerFour'];
    
    if (originalId !== cleanId) {
      console.log(`${key}: "${originalId}" → "${cleanId}"`);
      needsUpdate = true;
      
      // Map back to the correct field names
      if (key === 'playerOne') updateData.playerOneId = cleanId;
      else if (key === 'playerTwo') updateData.playerTwoId = cleanId;
      else if (key === 'playerThree') updateData.playerThreeId = cleanId;
      else if (key === 'playerFour') updateData.playerFourId = cleanId;
    }
  }
  
  // Verify all cleaned IDs exist
  const verifications = await Promise.all([
    cleanPlayerIds.playerOne ? verifyPlayer(databases, cleanPlayerIds.playerOne) : Promise.resolve({ exists: true, player: null }),
    cleanPlayerIds.playerTwo ? verifyPlayer(databases, cleanPlayerIds.playerTwo) : Promise.resolve({ exists: true, player: null }),
    cleanPlayerIds.playerThree ? verifyPlayer(databases, cleanPlayerIds.playerThree) : Promise.resolve({ exists: true, player: null }),
    cleanPlayerIds.playerFour ? verifyPlayer(databases, cleanPlayerIds.playerFour) : Promise.resolve({ exists: true, player: null })
  ]);
  
  const [player1Verify, player2Verify, player3Verify, player4Verify] = verifications;
  
  let allPlayersValid = true;
  
  if (cleanPlayerIds.playerOne && !player1Verify.exists) {
    console.log(`❌ Player 1 ID "${cleanPlayerIds.playerOne}" not found: ${player1Verify.error}`);
    allPlayersValid = false;
  } else if (player1Verify.player) {
    console.log(`✅ Player 1: ${player1Verify.player.firstName} ${player1Verify.player.lastName}`);
  }
  
  if (cleanPlayerIds.playerTwo && !player2Verify.exists) {
    console.log(`❌ Player 2 ID "${cleanPlayerIds.playerTwo}" not found: ${player2Verify.error}`);
    allPlayersValid = false;
  } else if (player2Verify.player) {
    console.log(`✅ Player 2: ${player2Verify.player.firstName} ${player2Verify.player.lastName}`);
  }
  
  if (cleanPlayerIds.playerThree && !player3Verify.exists) {
    console.log(`❌ Player 3 ID "${cleanPlayerIds.playerThree}" not found: ${player3Verify.error}`);
    allPlayersValid = false;
  } else if (player3Verify.player) {
    console.log(`✅ Player 3: ${player3Verify.player.firstName} ${player3Verify.player.lastName}`);
  }
  
  if (cleanPlayerIds.playerFour && !player4Verify.exists) {
    console.log(`❌ Player 4 ID "${cleanPlayerIds.playerFour}" not found: ${player4Verify.error}`);
    allPlayersValid = false;
  } else if (player4Verify.player) {
    console.log(`✅ Player 4: ${player4Verify.player.firstName} ${player4Verify.player.lastName}`);
  }
  
  // Note: Embedded player data is not supported in the current schema
  // The fix will focus only on cleaning up the corrupted player IDs
  
  if (!needsUpdate) {
    console.log('✅ No changes needed');
    return { success: true, updated: false };
  }
  
  if (!allPlayersValid) {
    console.log('❌ Cannot fix - some player IDs are invalid');
    return { success: false, updated: false, error: 'Invalid player IDs' };
  }
  
  if (dryRun) {
    console.log('🔍 DRY RUN: Would update with:');
    console.log(JSON.stringify(updateData, null, 2));
    return { success: true, updated: false, wouldUpdate: updateData };
  }
  
  // Actually update the match
  try {
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID,
      match.$id,
      updateData
    );
    
    console.log('✅ Match updated successfully');
    return { success: true, updated: true, updateData };
  } catch (error) {
    console.log(`❌ Failed to update match: ${error.message}`);
    return { success: false, updated: false, error: error.message };
  }
}

// Find and fix all corrupted matches
async function fixAllCorruptedMatches(dryRun = true) {
  console.log(`🔧 ${dryRun ? 'ANALYZING' : 'FIXING'} Corrupted Matches`);
  console.log('═'.repeat(60));
  
  const { databases } = createAdminClient();
  
  try {
    // Get all matches
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID
    );
    
    console.log(`Found ${response.documents.length} total matches`);
    
    // Find corrupted matches
    const corruptedMatches = response.documents.filter(match => {
      const hasCorruptedIds = [match.playerOneId, match.playerTwoId, match.playerThreeId, match.playerFourId]
        .some(id => id && typeof id === 'string' && id.includes(' '));
      
      // Note: Focus only on corrupted IDs, embedded data is not part of current schema
      const missingEmbeddedData = false;
      
      return hasCorruptedIds || missingEmbeddedData;
    });
    
    console.log(`Found ${corruptedMatches.length} matches that need attention`);
    
    if (corruptedMatches.length === 0) {
      console.log('✅ No corrupted matches found!');
      return;
    }
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const match of corruptedMatches) {
      const result = await fixMatch(databases, match, dryRun);
      
      if (result.success && result.updated) {
        fixedCount++;
      } else if (!result.success) {
        errorCount++;
      }
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Summary:');
    console.log('═'.repeat(60));
    console.log(`Total matches checked: ${corruptedMatches.length}`);
    if (dryRun) {
      console.log(`Matches that would be fixed: ${fixedCount}`);
      console.log(`Matches with errors: ${errorCount}`);
      console.log('\n💡 Run with --apply to actually make the changes');
    } else {
      console.log(`Matches fixed: ${fixedCount}`);
      console.log(`Matches with errors: ${errorCount}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to process matches:', error.message);
  }
}

// Fix a specific match
async function fixSpecificMatch(matchId, dryRun = true) {
  console.log(`🎯 ${dryRun ? 'ANALYZING' : 'FIXING'} Specific Match: ${matchId}`);
  console.log('═'.repeat(60));
  
  const { databases } = createAdminClient();
  
  try {
    const match = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId
    );
    
    await fixMatch(databases, match, dryRun);
    
  } catch (error) {
    console.error(`❌ Failed to process match ${matchId}:`, error.message);
  }
}

// Main function
async function main() {
  console.log('🎾 TennisScore Data Migration Tool');
  console.log('═'.repeat(60));
  
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];
  const apply = args.includes('--apply');
  
  console.log('Debug - args:', args);
  console.log('Debug - apply flag:', apply);
  
  console.log(`Mode: ${apply ? 'APPLY CHANGES' : 'DRY RUN (no changes will be made)'}`);
  console.log('');
  
  if (command === 'match' && param) {
    await fixSpecificMatch(param, !apply);
  } else if (command === 'all') {
    await fixAllCorruptedMatches(!apply);
  } else {
    console.log('Usage:');
    console.log('  npm run fix match <match-id> [--apply]  - Fix specific match');
    console.log('  npm run fix all [--apply]              - Fix all corrupted matches');
    console.log('');
    console.log('Examples:');
    console.log('  npm run fix match 6868fa310014b6130788        # Analyze specific match');
    console.log('  npm run fix match 6868fa310014b6130788 --apply # Fix specific match');
    console.log('  npm run fix all                               # Analyze all matches');
    console.log('  npm run fix all --apply                       # Fix all matches');
    console.log('');
    console.log('Default: Analyze the problematic match from your issue...');
    await fixSpecificMatch('6868fa310014b6130788', !apply);
  }
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main().catch(console.error);
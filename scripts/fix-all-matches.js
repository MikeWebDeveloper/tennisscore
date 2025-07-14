#!/usr/bin/env node
/**
 * Fix all matches with corrupted player IDs
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

async function fixAllMatches(dryRun = true) {
  console.log(`🔧 ${dryRun ? 'ANALYZING' : 'FIXING'} All Corrupted Matches`);
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
      return [match.playerOneId, match.playerTwoId, match.playerThreeId, match.playerFourId]
        .some(id => id && typeof id === 'string' && id.includes(' '));
    });
    
    console.log(`Found ${corruptedMatches.length} matches with corrupted player IDs`);
    
    if (corruptedMatches.length === 0) {
      console.log('✅ No corrupted matches found!');
      return;
    }
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const match of corruptedMatches) {
      console.log(`\n🔧 ${dryRun ? 'ANALYZING' : 'FIXING'} Match ${match.$id}`);
      console.log('─'.repeat(50));
      
      // Extract clean IDs
      const cleanPlayer1Id = extractPlayerId(match.playerOneId);
      const cleanPlayer2Id = extractPlayerId(match.playerTwoId);
      const cleanPlayer3Id = match.playerThreeId ? extractPlayerId(match.playerThreeId) : null;
      const cleanPlayer4Id = match.playerFourId ? extractPlayerId(match.playerFourId) : null;
      
      // Build update data only for changed IDs
      const updateData = {};
      
      if (match.playerOneId !== cleanPlayer1Id) {
        console.log(`Player 1: "${match.playerOneId}" → "${cleanPlayer1Id}"`);
        updateData.playerOneId = cleanPlayer1Id;
      }
      if (match.playerTwoId !== cleanPlayer2Id) {
        console.log(`Player 2: "${match.playerTwoId}" → "${cleanPlayer2Id}"`);
        updateData.playerTwoId = cleanPlayer2Id;
      }
      if (match.playerThreeId && match.playerThreeId !== cleanPlayer3Id) {
        console.log(`Player 3: "${match.playerThreeId}" → "${cleanPlayer3Id}"`);
        updateData.playerThreeId = cleanPlayer3Id;
      }
      if (match.playerFourId && match.playerFourId !== cleanPlayer4Id) {
        console.log(`Player 4: "${match.playerFourId}" → "${cleanPlayer4Id}"`);
        updateData.playerFourId = cleanPlayer4Id;
      }
      
      if (Object.keys(updateData).length === 0) {
        console.log('✅ No changes needed');
        continue;
      }
      
      if (dryRun) {
        console.log('🔍 DRY RUN: Would update with:');
        console.log(JSON.stringify(updateData, null, 2));
      } else {
        try {
          await databases.updateDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_MATCHES_COLLECTION_ID,
            match.$id,
            updateData
          );
          console.log('✅ Match updated successfully');
          fixedCount++;
        } catch (error) {
          console.log(`❌ Failed to update: ${error.message}`);
          errorCount++;
        }
      }
      
      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Summary:');
    console.log('═'.repeat(60));
    console.log(`Total corrupted matches: ${corruptedMatches.length}`);
    if (dryRun) {
      console.log(`Matches that would be fixed: ${corruptedMatches.length - errorCount}`);
      console.log('\n💡 Run with --apply to actually make the changes');
    } else {
      console.log(`Matches fixed: ${fixedCount}`);
      console.log(`Matches with errors: ${errorCount}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to process matches:', error.message);
  }
}

// Main function
async function main() {
  console.log('🎾 TennisScore Bulk Match Fixer');
  console.log('═'.repeat(60));
  
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  
  console.log(`Mode: ${apply ? 'APPLY CHANGES' : 'DRY RUN (no changes will be made)'}`);
  console.log('');
  
  await fixAllMatches(!apply);
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main().catch(console.error);
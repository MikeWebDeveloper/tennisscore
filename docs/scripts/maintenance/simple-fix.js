#!/usr/bin/env node
/**
 * Simple fix script to only clean up corrupted player IDs
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

async function fixSpecificMatch(matchId) {
  console.log(`🔧 Fixing Match ${matchId}`);
  console.log('═'.repeat(60));
  
  const { databases } = createAdminClient();
  
  try {
    // Get the match
    const match = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId
    );
    
    console.log('Current player IDs:');
    console.log(`Player 1: "${match.playerOneId}"`);
    console.log(`Player 2: "${match.playerTwoId}"`);
    if (match.playerThreeId) console.log(`Player 3: "${match.playerThreeId}"`);
    if (match.playerFourId) console.log(`Player 4: "${match.playerFourId}"`);
    
    // Extract clean IDs
    const cleanPlayer1Id = extractPlayerId(match.playerOneId);
    const cleanPlayer2Id = extractPlayerId(match.playerTwoId);
    const cleanPlayer3Id = match.playerThreeId ? extractPlayerId(match.playerThreeId) : null;
    const cleanPlayer4Id = match.playerFourId ? extractPlayerId(match.playerFourId) : null;
    
    console.log('\nClean player IDs:');
    console.log(`Player 1: "${cleanPlayer1Id}"`);
    console.log(`Player 2: "${cleanPlayer2Id}"`);
    if (cleanPlayer3Id) console.log(`Player 3: "${cleanPlayer3Id}"`);
    if (cleanPlayer4Id) console.log(`Player 4: "${cleanPlayer4Id}"`);
    
    // Build update data only for changed IDs
    const updateData = {};
    
    if (match.playerOneId !== cleanPlayer1Id) {
      updateData.playerOneId = cleanPlayer1Id;
    }
    if (match.playerTwoId !== cleanPlayer2Id) {
      updateData.playerTwoId = cleanPlayer2Id;
    }
    if (match.playerThreeId && match.playerThreeId !== cleanPlayer3Id) {
      updateData.playerThreeId = cleanPlayer3Id;
    }
    if (match.playerFourId && match.playerFourId !== cleanPlayer4Id) {
      updateData.playerFourId = cleanPlayer4Id;
    }
    
    if (Object.keys(updateData).length === 0) {
      console.log('\n✅ No changes needed');
      return;
    }
    
    console.log('\nUpdate data:');
    console.log(JSON.stringify(updateData, null, 2));
    
    // Apply the update
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId,
      updateData
    );
    
    console.log('\n✅ Match updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run for the specific problematic match
fixSpecificMatch('6868fa310014b6130788');
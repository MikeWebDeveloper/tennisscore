#!/usr/bin/env node
/**
 * Detailed Database Investigation Script
 * 
 * Investigates player ID issues and data corruption patterns
 */

const { Client, Databases, Query } = require("node-appwrite");
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

// List matches to find patterns
async function investigatePlayerIdPatterns() {
  console.log('🔍 Investigating Player ID Patterns');
  console.log('═'.repeat(60));

  const { databases } = createAdminClient();

  try {
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID
    );

    console.log(`Found ${response.documents.length} total matches`);
    
    const problematicMatches = [];
    const validMatches = [];
    
    response.documents.forEach((match) => {
      // Check if player IDs look suspicious
      const playerIds = [match.playerOneId, match.playerTwoId, match.playerThreeId, match.playerFourId].filter(Boolean);
      
      let hasIssues = false;
      let issueTypes = [];
      
      playerIds.forEach(playerId => {
        // Check for malformed IDs
        if (playerId && !playerId.startsWith('anonymous-')) {
          // Valid Appwrite document IDs should be 20 characters and alphanumeric + underscores
          if (playerId.length > 36 || /[^a-zA-Z0-9_]/.test(playerId)) {
            hasIssues = true;
            issueTypes.push(`Invalid ID format: ${playerId}`);
          }
          // Check for space characters (common issue)
          if (playerId.includes(' ')) {
            hasIssues = true;
            issueTypes.push(`Contains spaces: ${playerId}`);
          }
        }
      });
      
      // Check for missing embedded data on newer matches
      if (!match.playerOneData && !match.playerTwoData && 
          !match.playerOneId?.startsWith('anonymous-') && 
          !match.playerTwoId?.startsWith('anonymous-')) {
        hasIssues = true;
        issueTypes.push('Missing embedded player data');
      }
      
      if (hasIssues) {
        problematicMatches.push({
          id: match.$id,
          created: match.$createdAt,
          playerIds: playerIds,
          issues: issueTypes,
          status: match.status,
          userId: match.userId
        });
      } else {
        validMatches.push({
          id: match.$id,
          created: match.$createdAt,
          playerIds: playerIds,
          status: match.status
        });
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`Valid matches: ${validMatches.length}`);
    console.log(`Problematic matches: ${problematicMatches.length}`);
    
    if (problematicMatches.length > 0) {
      console.log('\n⚠️  Problematic Matches:');
      console.log('─'.repeat(40));
      
      problematicMatches.forEach((match, index) => {
        console.log(`\n${index + 1}. Match ${match.id}`);
        console.log(`   Created: ${match.created}`);
        console.log(`   Status: ${match.status}`);
        console.log(`   User: ${match.userId}`);
        console.log(`   Player IDs: ${JSON.stringify(match.playerIds)}`);
        console.log(`   Issues: ${match.issues.join(', ')}`);
      });
    }
    
    if (validMatches.length > 0) {
      console.log('\n✅ Recent Valid Matches (last 3):');
      console.log('─'.repeat(40));
      
      validMatches
        .sort((a, b) => new Date(b.created) - new Date(a.created))
        .slice(0, 3)
        .forEach((match, index) => {
          console.log(`${index + 1}. Match ${match.id} (${match.status})`);
          console.log(`   Player IDs: ${JSON.stringify(match.playerIds)}`);
        });
    }
    
  } catch (error) {
    console.error('❌ Failed to investigate patterns:', error.message);
  }
}

// Check actual players collection to see valid IDs
async function checkPlayersCollection() {
  console.log('\n🎭 Players Collection Analysis');
  console.log('═'.repeat(60));

  const { databases } = createAdminClient();

  try {
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_PLAYERS_COLLECTION_ID,
      [Query.limit(10), Query.orderDesc('$createdAt')]
    );

    console.log(`Found ${response.documents.length} players (showing last 10)`);
    
    if (response.documents.length > 0) {
      console.log('\n📋 Recent Players:');
      console.log('─'.repeat(40));
      
      response.documents.forEach((player, index) => {
        console.log(`${index + 1}. ${player.$id}: ${player.firstName} ${player.lastName} (User: ${player.userId})`);
      });
      
      console.log('\n📏 ID Format Analysis:');
      console.log('─'.repeat(40));
      
      response.documents.forEach((player) => {
        console.log(`${player.$id}: Length=${player.$id.length}, Format=${/^[a-zA-Z0-9_]+$/.test(player.$id) ? 'Valid' : 'Invalid'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to check players collection:', error.message);
  }
}

// Investigate the specific problematic match in detail
async function investigateSpecificMatch() {
  console.log('\n🎯 Detailed Analysis of Match 6868fa310014b6130788');
  console.log('═'.repeat(60));

  const { databases } = createAdminClient();
  const matchId = '6868fa310014b6130788';

  try {
    const match = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId
    );

    console.log('Raw player ID data:');
    console.log('─'.repeat(40));
    console.log(`Player 1 ID (raw): "${match.playerOneId}"`);
    console.log(`Player 1 ID (type): ${typeof match.playerOneId}`);
    console.log(`Player 1 ID (length): ${match.playerOneId ? match.playerOneId.length : 'null'}`);
    console.log(`Player 1 ID (hex): ${match.playerOneId ? Buffer.from(match.playerOneId, 'utf8').toString('hex') : 'null'}`);
    
    console.log(`\nPlayer 2 ID (raw): "${match.playerTwoId}"`);
    console.log(`Player 2 ID (type): ${typeof match.playerTwoId}`);
    console.log(`Player 2 ID (length): ${match.playerTwoId ? match.playerTwoId.length : 'null'}`);
    console.log(`Player 2 ID (hex): ${match.playerTwoId ? Buffer.from(match.playerTwoId, 'utf8').toString('hex') : 'null'}`);
    
    // Try to decode what might be happening
    console.log('\n🔧 Diagnosis:');
    console.log('─'.repeat(40));
    
    // Check if it looks like concatenated ID + name
    if (match.playerOneId && match.playerOneId.includes(' ')) {
      const parts = match.playerOneId.split(' ');
      console.log(`Player 1 appears to be: ID="${parts[0]}" + Name="${parts.slice(1).join(' ')}"`);
    }
    
    if (match.playerTwoId && match.playerTwoId.includes(' ')) {
      const parts = match.playerTwoId.split(' ');
      console.log(`Player 2 appears to be: ID="${parts[0]}" + Name="${parts.slice(1).join(' ')}"`);
    }
    
    // Check if the first part (before space) is a valid Appwrite ID
    if (match.playerOneId && match.playerOneId.includes(' ')) {
      const potentialId = match.playerOneId.split(' ')[0];
      console.log(`\nTrying to lookup potential Player 1 ID: "${potentialId}"`);
      try {
        const player = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID,
          potentialId
        );
        console.log(`✅ Found Player 1: ${player.firstName} ${player.lastName}`);
      } catch (error) {
        console.log(`❌ Player 1 lookup failed: ${error.message}`);
      }
    }
    
    if (match.playerTwoId && match.playerTwoId.includes(' ')) {
      const potentialId = match.playerTwoId.split(' ')[0];
      console.log(`\nTrying to lookup potential Player 2 ID: "${potentialId}"`);
      try {
        const player = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID,
          potentialId
        );
        console.log(`✅ Found Player 2: ${player.firstName} ${player.lastName}`);
      } catch (error) {
        console.log(`❌ Player 2 lookup failed: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to investigate specific match:', error.message);
  }
}

// Main function
async function main() {
  console.log('🔍 TennisScore Detailed Database Investigation');
  console.log('═'.repeat(60));
  
  await investigatePlayerIdPatterns();
  await checkPlayersCollection();
  await investigateSpecificMatch();
  
  console.log('\n💡 Recommendations:');
  console.log('═'.repeat(60));
  console.log('1. Check match creation logic for player ID corruption');
  console.log('2. Implement data validation before storing player IDs');
  console.log('3. Add data migration script to fix corrupted matches');
  console.log('4. Consider adding embedded player data to prevent lookup failures');
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main().catch(console.error);
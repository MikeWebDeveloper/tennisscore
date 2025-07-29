#!/usr/bin/env node
/**
 * Quick Database Investigation Script for TennisScore
 * 
 * A simpler Node.js version that doesn't require TypeScript compilation
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

// Helper function to safely parse JSON strings
function safeJsonParse(jsonString) {
  if (typeof jsonString !== 'string') return jsonString;
  try {
    return JSON.parse(jsonString);
  } catch {
    return jsonString;
  }
}

// Investigate a specific match
async function investigateMatch(matchId) {
  console.log(`🔍 Investigating Match ID: ${matchId}`);
  console.log('═'.repeat(60));

  const { databases } = createAdminClient();

  try {
    // Fetch the match document
    const match = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId
    );

    console.log('📊 Match Document:');
    console.log('─'.repeat(40));
    console.log(`Match ID: ${match.$id}`);
    console.log(`Created: ${match.$createdAt}`);
    console.log(`Updated: ${match.$updatedAt}`);
    console.log(`User ID: ${match.userId}`);
    console.log(`Status: ${match.status}`);
    console.log(`Date: ${match.matchDate}`);
    console.log(`Is Doubles: ${match.isDoubles}`);
    console.log(`Tournament: ${match.tournamentName || 'None'}`);
    console.log(`Detail Level: ${match.detailLevel}`);
    
    console.log('\n🎾 Player IDs:');
    console.log('─'.repeat(40));
    console.log(`Player 1 ID: ${match.playerOneId}`);
    console.log(`Player 2 ID: ${match.playerTwoId}`);
    if (match.playerThreeId) console.log(`Player 3 ID: ${match.playerThreeId}`);
    if (match.playerFourId) console.log(`Player 4 ID: ${match.playerFourId}`);

    // Check for embedded player data
    console.log('\n🏷️  Embedded Player Data:');
    console.log('─'.repeat(40));
    
    if (match.playerOneData) {
      const playerOneData = safeJsonParse(match.playerOneData);
      console.log(`Player 1 Embedded:`, playerOneData);
    } else {
      console.log('Player 1 Embedded: None');
    }
    
    if (match.playerTwoData) {
      const playerTwoData = safeJsonParse(match.playerTwoData);
      console.log(`Player 2 Embedded:`, playerTwoData);
    } else {
      console.log('Player 2 Embedded: None');
    }
    
    if (match.playerThreeData) {
      const playerThreeData = safeJsonParse(match.playerThreeData);
      console.log(`Player 3 Embedded:`, playerThreeData);
    }
    
    if (match.playerFourData) {
      const playerFourData = safeJsonParse(match.playerFourData);
      console.log(`Player 4 Embedded:`, playerFourData);
    }

    // Attempt to fetch actual player documents
    console.log('\n👤 Player Document Lookup:');
    console.log('─'.repeat(40));
    
    const playerIds = [match.playerOneId, match.playerTwoId, match.playerThreeId, match.playerFourId].filter(Boolean);
    
    for (const playerId of playerIds) {
      if (playerId.startsWith('anonymous-')) {
        console.log(`${playerId}: Anonymous player - no database lookup needed`);
        continue;
      }
      
      try {
        const player = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID,
          playerId
        );
        console.log(`${playerId}: ${player.firstName} ${player.lastName} (${player.userId})`);
      } catch (error) {
        console.log(`${playerId}: ❌ ERROR - ${error.message || 'Document not found'}`);
        
        // Check if it's a permission/ownership issue
        if (error.code === 401 || error.type === 'general_unauthorized_scope') {
          console.log(`  → This might be an ownership issue - player belongs to different user`);
        } else if (error.code === 404 || error.type === 'document_not_found') {
          console.log(`  → Player document was deleted or never existed`);
        }
      }
    }

    // Check score and point log
    console.log('\n📈 Match Data:');
    console.log('─'.repeat(40));
    
    if (match.score) {
      const score = safeJsonParse(match.score);
      console.log('Score:', JSON.stringify(score, null, 2));
    }
    
    if (match.pointLog && Array.isArray(match.pointLog)) {
      console.log(`Point Log: ${match.pointLog.length} entries`);
      if (match.pointLog.length > 0) {
        console.log('First point:', match.pointLog[0]);
        if (match.pointLog.length > 1) {
          console.log('Last point:', match.pointLog[match.pointLog.length - 1]);
        }
      }
    }

    // Check match format
    if (match.matchFormat) {
      const format = safeJsonParse(match.matchFormat);
      console.log('Format:', JSON.stringify(format, null, 2));
    }

    console.log('\n🔍 Analysis:');
    console.log('─'.repeat(40));
    
    // Analyze the issue
    let hasIssues = false;
    
    // Check if this might be from an older version
    if (!match.playerOneData && !match.playerTwoData) {
      console.log('⚠️  This match has no embedded player data - might be from before this feature was added');
      hasIssues = true;
    }
    
    // Check for anonymous players without embedded data
    if (match.playerOneId?.startsWith('anonymous-') && !match.playerOneData) {
      console.log('⚠️  Anonymous player 1 without embedded data');
      hasIssues = true;
    }
    
    if (match.playerTwoId?.startsWith('anonymous-') && !match.playerTwoData) {
      console.log('⚠️  Anonymous player 2 without embedded data');
      hasIssues = true;
    }
    
    if (!hasIssues) {
      console.log('✅ No obvious data issues found');
    }

  } catch (error) {
    console.error('❌ Failed to fetch match:', error.message);
    
    if (error.code === 404) {
      console.log('Match not found - it may have been deleted');
    } else if (error.code === 401) {
      console.log('Permission denied - you may not have access to this match');
    }
  }
}

// Check environment configuration
function checkEnvironment() {
  console.log('🔧 Environment Check');
  console.log('═'.repeat(60));
  
  const requiredVars = [
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'NEXT_PUBLIC_APPWRITE_PROJECT', 
    'APPWRITE_API_KEY',
    'APPWRITE_DATABASE_ID',
    'APPWRITE_MATCHES_COLLECTION_ID',
    'APPWRITE_PLAYERS_COLLECTION_ID'
  ];
  
  let allGood = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // Mask sensitive values
      if (varName.includes('API_KEY')) {
        console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
      } else {
        console.log(`✅ ${varName}: ${value}`);
      }
    } else {
      console.log(`❌ ${varName}: Missing!`);
      allGood = false;
    }
  });
  
  if (!allGood) {
    console.log('\n⚠️  Missing environment variables! Make sure .env.local is properly configured.');
    process.exit(1);
  }
  
  console.log('\n✅ Environment configuration looks good!');
}

// Main function
async function main() {
  console.log('🎾 TennisScore Database Investigation Tool');
  console.log('═'.repeat(60));
  
  // Check environment first
  checkEnvironment();
  console.log('\n');
  
  // Investigate the specific match mentioned in the issue
  console.log('🎯 Investigating the specific match from your issue...\n');
  await investigateMatch('6868fa310014b6130788');
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main().catch(console.error);
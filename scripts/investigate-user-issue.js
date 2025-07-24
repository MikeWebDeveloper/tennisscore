import { Client, Databases, Account } from 'node-appwrite';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT || '68460965002524f1942e')
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const account = new Account(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'tennisscore_db';
const PLAYERS_COLLECTION_ID = process.env.APPWRITE_PLAYERS_COLLECTION_ID || 'players';
const MATCHES_COLLECTION_ID = process.env.APPWRITE_MATCHES_COLLECTION_ID || 'matches';

async function investigateUserIssue() {
  console.log('🔍 Investigating user dashboard access issue...\n');
  console.log('Environment check:');
  console.log(`- Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);
  console.log(`- Project: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`);
  console.log(`- Database: ${DATABASE_ID}`);
  console.log(`- Players Collection: ${PLAYERS_COLLECTION_ID}`);
  console.log(`- API Key: ${process.env.APPWRITE_API_KEY ? 'Present' : 'Missing'}\n`);

  try {
    // Get all players first to understand the data structure
    console.log('📋 Getting all players to understand data structure...');
    const allPlayersResponse = await databases.listDocuments(
      DATABASE_ID,
      PLAYERS_COLLECTION_ID
    );
    
    console.log(`📊 Total players in collection: ${allPlayersResponse.total}`);
    
    // Group players by userId to see which users have players
    const playersByUserId = {};
    allPlayersResponse.documents.forEach(player => {
      const userId = player.userId;
      if (!playersByUserId[userId]) {
        playersByUserId[userId] = [];
      }
      playersByUserId[userId].push(player);
    });
    
    console.log(`\n👥 Users with players: ${Object.keys(playersByUserId).length}`);
    console.log('User IDs found:');
    Object.keys(playersByUserId).forEach(userId => {
      const players = playersByUserId[userId];
      const mainPlayer = players.find(p => p.isMainPlayer);
      console.log(`   - ${userId}: ${players.length} players, main: ${mainPlayer ? mainPlayer.name : 'none'}`);
    });
    
    // Show detailed player information
    console.log('\n📋 Detailed player information:');
    allPlayersResponse.documents.slice(0, 20).forEach((player, index) => {
      console.log(`\n   Player ${index + 1}:`);
      console.log(`   - ID: ${player.$id}`);
      console.log(`   - Name: ${player.name || 'undefined'}`);
      console.log(`   - User ID: ${player.userId}`);
      console.log(`   - Is Main Player: ${player.isMainPlayer}`);
      console.log(`   - Created: ${player.$createdAt}`);
      console.log(`   - Updated: ${player.$updatedAt}`);
    });
    
    // Check matches collection
    console.log('\n📋 Checking matches collection...');
    const allMatchesResponse = await databases.listDocuments(
      DATABASE_ID,
      MATCHES_COLLECTION_ID
    );
    
    console.log(`📊 Total matches in collection: ${allMatchesResponse.total}`);
    
    // Group matches by userId
    const matchesByUserId = {};
    allMatchesResponse.documents.forEach(match => {
      const userId = match.userId;
      if (!matchesByUserId[userId]) {
        matchesByUserId[userId] = [];
      }
      matchesByUserId[userId].push(match);
    });
    
    console.log(`\n🎾 Users with matches: ${Object.keys(matchesByUserId).length}`);
    console.log('User IDs with matches:');
    Object.keys(matchesByUserId).forEach(userId => {
      const matches = matchesByUserId[userId];
      console.log(`   - ${userId}: ${matches.length} matches`);
    });
    
    // Show sample matches
    console.log('\n📋 Sample matches:');
    allMatchesResponse.documents.slice(0, 5).forEach((match, index) => {
      console.log(`\n   Match ${index + 1}:`);
      console.log(`   - ID: ${match.$id}`);
      console.log(`   - Date: ${match.matchDate}`);
      console.log(`   - User ID: ${match.userId}`);
      console.log(`   - Player One: ${match.playerOneId}`);
      console.log(`   - Player Two: ${match.playerTwoId}`);
    });
    
    // Now let's try to find which user IDs correspond to our email addresses
    console.log('\n🔍 Analysis:');
    console.log('The issue is that the database stores Appwrite user IDs, not email addresses.');
    console.log('The code is trying to query by email, but should query by user ID.');
    console.log('\nTo fix this, we need to:');
    console.log('1. Find the Appwrite user IDs for both email addresses');
    console.log('2. Update the code to use user IDs instead of emails for queries');
    console.log('3. Ensure the session management returns the correct user ID');
    
  } catch (error) {
    console.log(`❌ Error during investigation: ${error.message}`);
  }
}

// Run the investigation
investigateUserIssue().catch(console.error); 
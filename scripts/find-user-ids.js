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

async function findUserIds() {
  console.log('🔍 Finding user IDs for specific email addresses...\n');

  const targetEmails = [
    'mareklatal@seznam.cz',
    'michal.latal@yahoo.co.uk'
  ];

  try {
    // Get all players to analyze
    console.log('📋 Getting all players...');
    const allPlayersResponse = await databases.listDocuments(
      DATABASE_ID,
      PLAYERS_COLLECTION_ID
    );
    
    console.log(`📊 Total players: ${allPlayersResponse.total}`);
    
    // Get all matches to analyze
    console.log('📋 Getting all matches...');
    const allMatchesResponse = await databases.listDocuments(
      DATABASE_ID,
      MATCHES_COLLECTION_ID
    );
    
    console.log(`📊 Total matches: ${allMatchesResponse.total}`);
    
    // Group players by userId
    const playersByUserId = {};
    allPlayersResponse.documents.forEach(player => {
      const userId = player.userId;
      if (!playersByUserId[userId]) {
        playersByUserId[userId] = [];
      }
      playersByUserId[userId].push(player);
    });
    
    // Group matches by userId
    const matchesByUserId = {};
    allMatchesResponse.documents.forEach(match => {
      const userId = match.userId;
      if (!matchesByUserId[userId]) {
        matchesByUserId[userId] = [];
      }
      matchesByUserId[userId].push(match);
    });
    
    console.log('\n👥 Analysis by User ID:');
    console.log('=' .repeat(60));
    
    Object.keys(playersByUserId).forEach(userId => {
      const players = playersByUserId[userId];
      const matches = matchesByUserId[userId] || [];
      const mainPlayer = players.find(p => p.isMainPlayer);
      
      console.log(`\n📊 User ID: ${userId}`);
      console.log(`   Players: ${players.length}`);
      console.log(`   Matches: ${matches.length}`);
      console.log(`   Main Player: ${mainPlayer ? mainPlayer.name || 'undefined name' : 'none'}`);
      
      if (players.length > 0) {
        console.log(`   Player Details:`);
        players.forEach((player, index) => {
          console.log(`     ${index + 1}. ${player.name || 'undefined'} (ID: ${player.$id}, Main: ${player.isMainPlayer})`);
        });
      }
      
      if (matches.length > 0) {
        console.log(`   Recent Matches:`);
        matches.slice(0, 3).forEach((match, index) => {
          console.log(`     ${index + 1}. ${match.matchDate} (ID: ${match.$id})`);
        });
      }
    });
    
    // Now let's try to identify which user IDs correspond to our target emails
    console.log('\n🔍 Attempting to identify user IDs for target emails...');
    console.log('=' .repeat(60));
    
    // Since we can't directly query Appwrite users, let's look for patterns
    // The user IDs we see are: 68488e27003de6aa1e88, 68510934003e6fc65150, 68489bf90014c0cfb5c3, etc.
    
    // Let's check if any of these users have recent activity that might help identify them
    const recentActivity = {};
    
    Object.keys(playersByUserId).forEach(userId => {
      const players = playersByUserId[userId];
      const matches = matchesByUserId[userId] || [];
      
      // Find the most recent activity
      let latestActivity = null;
      
      // Check player creation dates
      players.forEach(player => {
        const createdAt = new Date(player.$createdAt);
        if (!latestActivity || createdAt > latestActivity) {
          latestActivity = createdAt;
        }
      });
      
      // Check match dates
      matches.forEach(match => {
        const matchDate = new Date(match.matchDate);
        if (!latestActivity || matchDate > latestActivity) {
          latestActivity = matchDate;
        }
      });
      
      recentActivity[userId] = {
        players: players.length,
        matches: matches.length,
        mainPlayer: players.find(p => p.isMainPlayer)?.name || 'none',
        latestActivity: latestActivity,
        hasMainPlayer: !!players.find(p => p.isMainPlayer)
      };
    });
    
    console.log('\n📅 Recent Activity Analysis:');
    Object.entries(recentActivity)
      .sort((a, b) => b[1].latestActivity - a[1].latestActivity)
      .forEach(([userId, data]) => {
        console.log(`\n   ${userId}:`);
        console.log(`     Players: ${data.players}, Matches: ${data.matches}`);
        console.log(`     Main Player: ${data.mainPlayer}`);
        console.log(`     Latest Activity: ${data.latestActivity.toISOString()}`);
        console.log(`     Has Main Player: ${data.hasMainPlayer}`);
      });
    
    console.log('\n🔍 Conclusion:');
    console.log('Based on the data analysis:');
    console.log('1. User ID 68510934003e6fc65150 has the most activity (11 players, 7 matches)');
    console.log('2. User ID 68488e27003de6aa1e88 has 5 players and 7 matches');
    console.log('3. User ID 68489bf90014c0cfb5c3 has 3 players and no matches');
    console.log('4. All player names are undefined, indicating a data issue');
    console.log('5. Some users have main players set, others don\'t');
    
    console.log('\n💡 Recommendations:');
    console.log('1. Fix the player name data issue (all names are undefined)');
    console.log('2. Ensure main players are properly set for all users');
    console.log('3. The dashboard should work for users with main players set');
    console.log('4. Users without main players will see the setup prompt');
    
  } catch (error) {
    console.log(`❌ Error during investigation: ${error.message}`);
  }
}

// Run the investigation
findUserIds().catch(console.error); 
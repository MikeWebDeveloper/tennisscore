require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

async function checkMatch(matchId) {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    console.log(`🔍 Checking match: ${matchId}\n`);
    
    // Fetch the match
    const match = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId
    );

    console.log('📊 Match Details:');
    console.log(`   ID: ${match.$id}`);
    console.log(`   Status: ${match.status}`);
    console.log(`   Created: ${new Date(match.$createdAt).toLocaleString()}`);
    console.log(`   Player One ID: ${match.playerOneId || 'null'}`);
    console.log(`   Player Two ID: ${match.playerTwoId || 'null'}`);
    console.log(`   Player One Data: ${match.playerOneData ? 'exists' : 'null'}`);
    console.log(`   Player Two Data: ${match.playerTwoData ? 'exists' : 'null'}`);
    console.log(`   Score: ${match.score}`);
    console.log(`   Point Log Length: ${match.pointLog?.length || 0}`);
    console.log('');

    // Try to fetch player data
    if (match.playerOneData) {
      console.log('👤 Player One (embedded data):');
      console.log(`   Name: ${match.playerOneData.firstName} ${match.playerOneData.lastName}`);
    } else if (match.playerOneId) {
      try {
        const playerOne = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID,
          match.playerOneId
        );
        console.log('👤 Player One (from database):');
        console.log(`   Name: ${playerOne.firstName} ${playerOne.lastName}`);
      } catch (error) {
        console.log('❌ Player One fetch failed:', error.message);
      }
    }

    if (match.playerTwoData) {
      console.log('👤 Player Two (embedded data):');
      console.log(`   Name: ${match.playerTwoData.firstName} ${match.playerTwoData.lastName}`);
    } else if (match.playerTwoId) {
      try {
        const playerTwo = await databases.getDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_PLAYERS_COLLECTION_ID,
          match.playerTwoId
        );
        console.log('👤 Player Two (from database):');
        console.log(`   Name: ${playerTwo.firstName} ${playerTwo.lastName}`);
      } catch (error) {
        console.log('❌ Player Two fetch failed:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error fetching match:', error.message);
  }
}

const matchId = process.argv[2] || '6855e88200007f58bf0e';
checkMatch(matchId); 
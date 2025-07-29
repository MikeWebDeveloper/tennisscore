require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

// Initialize Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkMatchData() {
  try {
    // Replace with a real match ID from your database
    const matchId = process.argv[2];
    
    if (!matchId) {
      console.log('Please provide a match ID as argument');
      process.exit(1);
    }

    const match = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId
    );

    console.log('\n=== Match Data ===');
    console.log('ID:', match.$id);
    console.log('Status:', match.status);
    console.log('Score:', match.score);
    
    if (match.pointLog && match.pointLog.length > 0) {
      console.log('\n=== Point Log Analysis ===');
      console.log('Total points:', match.pointLog.length);
      
      // Parse and analyze points
      const points = match.pointLog.map(p => JSON.parse(p));
      
      // Check last few points
      console.log('\n=== Last 5 Points ===');
      points.slice(-5).forEach(point => {
        console.log(`Point ${point.pointNumber}:`, {
          winner: point.winner,
          server: point.server,
          gameScore: point.gameScore,
          isGameWinning: point.isGameWinning,
          isBreakPoint: point.isBreakPoint,
          setNumber: point.setNumber,
          gameNumber: point.gameNumber
        });
      });
      
      // Count game-winning points
      const gameWinningPoints = points.filter(p => p.isGameWinning);
      console.log('\n=== Game Winning Points ===');
      console.log('Total:', gameWinningPoints.length);
      gameWinningPoints.forEach(p => {
        console.log(`Game ${p.setNumber}-${p.gameNumber}: ${p.winner} wins (server: ${p.server})`);
      });
      
      // Check for breaks
      const breaks = gameWinningPoints.filter(p => p.server !== p.winner);
      console.log('\n=== Breaks of Serve ===');
      console.log('Total:', breaks.length);
      breaks.forEach(p => {
        console.log(`Set ${p.setNumber}, Game ${p.gameNumber}: ${p.winner} breaks ${p.server}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMatchData(); 
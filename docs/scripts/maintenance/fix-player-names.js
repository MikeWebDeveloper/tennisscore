import { Client, Databases } from 'node-appwrite';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT || '68460965002524f1942e')
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'tennisscore_db';
const PLAYERS_COLLECTION_ID = process.env.APPWRITE_PLAYERS_COLLECTION_ID || 'players';

async function fixPlayerNames() {
  console.log('🔧 Fixing undefined player names...\n');

  try {
    // Get all players
    console.log('📋 Getting all players...');
    const allPlayersResponse = await databases.listDocuments(
      DATABASE_ID,
      PLAYERS_COLLECTION_ID
    );
    
    console.log(`📊 Found ${allPlayersResponse.total} players`);
    
    // Find players with undefined names
    const playersWithUndefinedNames = allPlayersResponse.documents.filter(player => 
      !player.name || player.name === 'undefined' || player.name === undefined
    );
    
    console.log(`🔍 Found ${playersWithUndefinedNames.length} players with undefined names`);
    
    if (playersWithUndefinedNames.length === 0) {
      console.log('✅ All player names are already set correctly!');
      return;
    }
    
    // Group by userId to understand the context
    const playersByUserId = {};
    playersWithUndefinedNames.forEach(player => {
      const userId = player.userId;
      if (!playersByUserId[userId]) {
        playersByUserId[userId] = [];
      }
      playersByUserId[userId].push(player);
    });
    
    console.log('\n👥 Players by User ID:');
    Object.keys(playersByUserId).forEach(userId => {
      const players = playersByUserId[userId];
      console.log(`\n   User ${userId}: ${players.length} players`);
      players.forEach((player, index) => {
        console.log(`     ${index + 1}. ID: ${player.$id}, Main: ${player.isMainPlayer}, Name: ${player.name || 'undefined'}`);
      });
    });
    
    // Fix player names based on context
    console.log('\n🔧 Fixing player names...');
    let fixedCount = 0;
    
    for (const [userId, players] of Object.entries(playersByUserId)) {
      console.log(`\n   Fixing players for user ${userId}:`);
      
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        let newName = '';
        
        // Generate appropriate names based on context
        if (player.isMainPlayer) {
          // Main player gets a proper name
          newName = `Main Player ${i + 1}`;
        } else {
          // Other players get numbered names
          newName = `Player ${i + 1}`;
        }
        
        try {
          await databases.updateDocument(
            DATABASE_ID,
            PLAYERS_COLLECTION_ID,
            player.$id,
            {
              name: newName
            }
          );
          
          console.log(`     ✅ Fixed: ${player.$id} -> "${newName}"`);
          fixedCount++;
        } catch (error) {
          console.log(`     ❌ Failed to fix ${player.$id}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} player names successfully!`);
    
    // Verify the fixes
    console.log('\n🔍 Verifying fixes...');
    const verifyResponse = await databases.listDocuments(
      DATABASE_ID,
      PLAYERS_COLLECTION_ID
    );
    
    const stillUndefined = verifyResponse.documents.filter(player => 
      !player.name || player.name === 'undefined' || player.name === undefined
    );
    
    if (stillUndefined.length === 0) {
      console.log('✅ All player names are now properly set!');
    } else {
      console.log(`⚠️  ${stillUndefined.length} players still have undefined names`);
    }
    
  } catch (error) {
    console.log(`❌ Error fixing player names: ${error.message}`);
  }
}

// Run the fix
fixPlayerNames().catch(console.error); 
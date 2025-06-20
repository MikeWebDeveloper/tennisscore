require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

async function listMatches() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    console.log('🔍 Fetching all matches from database...');
    console.log('🔧 Environment check:');
    console.log(`   Endpoint: ${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);
    console.log(`   Project: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`);
    console.log(`   Database: ${process.env.APPWRITE_DATABASE_ID}`);
    console.log(`   Collection: ${process.env.APPWRITE_MATCHES_COLLECTION_ID}`);
    console.log('');
    
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID
    );

    console.log(`📊 Found ${response.documents.length} matches:\n`);
    
    response.documents.forEach((match, index) => {
      console.log(`${index + 1}. Match ID: ${match.$id}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Created: ${new Date(match.$createdAt).toLocaleString()}`);
      console.log(`   Live URL: http://localhost:3002/live/${match.$id}`);
      console.log(`   Public URL: https://tennis.mikewebdeveloper.co.uk/live/${match.$id}`);
      console.log('');
    });

    if (response.documents.length === 0) {
      console.log('❌ No matches found in database');
      console.log('💡 Try creating a new match first');
    }

  } catch (error) {
    console.error('❌ Error fetching matches:', error.message);
    if (error.code === 401) {
      console.log('🔑 Check your Appwrite API key and permissions');
    }
  }
}

listMatches(); 
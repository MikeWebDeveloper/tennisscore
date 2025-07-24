#!/usr/bin/env node

/**
 * Appwrite Setup Verification Script
 * This script helps verify your Appwrite configuration and generates sample data
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { Client, Databases, Account, Storage } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const account = new Account(client);
const storage = new Storage(client);

async function checkConnection() {
  try {
    console.log('🔍 Checking Appwrite connection...');
    await account.get();
    console.log('✅ Connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function checkDatabase() {
  try {
    console.log('\n🗄️  Checking database...');
    const database = await databases.get(process.env.APPWRITE_DATABASE_ID);
    console.log(`✅ Database found: ${database.name} (${database.$id})`);
    return true;
  } catch (error) {
    console.error('❌ Database not found:', error.message);
    console.log('📝 Please create a database first and update your .env.local file');
    return false;
  }
}

async function checkCollections() {
  try {
    console.log('\n📋 Checking collections...');
    
    // Check Players collection
    try {
      const playersCollection = await databases.getCollection(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_PLAYERS_COLLECTION_ID
      );
      console.log(`✅ Players collection found: ${playersCollection.name}`);
         } catch {
       console.error('❌ Players collection not found');
       console.log('📝 Please create the Players collection');
     }

     // Check Matches collection
     try {
       const matchesCollection = await databases.getCollection(
         process.env.APPWRITE_DATABASE_ID,
         process.env.APPWRITE_MATCHES_COLLECTION_ID
       );
       console.log(`✅ Matches collection found: ${matchesCollection.name}`);
     } catch {
       console.error('❌ Matches collection not found');
       console.log('📝 Please create the Matches collection');
     }
   } catch (error) {
     console.error('❌ Error checking collections:', error.message);
   }
}

async function checkStorage() {
  try {
    console.log('\n🗂️  Checking storage buckets...');
    
    // Check Profile Pictures bucket
    try {
      const profileBucket = await storage.getBucket(process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID);
      console.log(`✅ Profile Pictures bucket found: ${profileBucket.name}`);
         } catch {
       console.error('❌ Profile Pictures bucket not found');
     }

    // List all buckets for reference
    const buckets = await storage.listBuckets();
    console.log(`📁 Available buckets: ${buckets.buckets.map(b => b.name).join(', ')}`);
  } catch (error) {
    console.error('❌ Error checking storage:', error.message);
  }
}

async function generateSampleData() {
  try {
    console.log('\n🎾 Would you like to create sample data? (This is just a demo)');
    console.log('Sample data structure for Players:');
    console.log({
      firstName: "John",
      lastName: "Doe", 
      yearOfBirth: 2005,
      rating: "4.0",
      userId: "user-id-here"
    });

    console.log('\nSample data structure for Matches:');
    console.log({
      playerOneId: "player-1-id",
      playerTwoId: "player-2-id",
      matchDate: new Date().toISOString(),
      matchFormat: JSON.stringify({ sets: 3, noAd: false }),
      status: "In Progress",
      score: JSON.stringify({ sets: [0, 0], games: [0, 0], points: [0, 0] }),
      userId: "user-id-here"
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  console.log('🎾 TennisScore Appwrite Setup Verification\n');
  
  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'NEXT_PUBLIC_APPWRITE_PROJECT', 
    'APPWRITE_API_KEY',
    'APPWRITE_DATABASE_ID',
    'APPWRITE_PLAYERS_COLLECTION_ID',
    'APPWRITE_MATCHES_COLLECTION_ID'
  ];

  console.log('🔧 Checking environment variables...');
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('📝 Please update your .env.local file');
    return;
  }
  console.log('✅ All environment variables found');

  // Run checks
  const connectionOk = await checkConnection();
  if (!connectionOk) return;

  await checkDatabase();
  await checkCollections();
  await checkStorage();
  await generateSampleData();

  console.log('\n🎉 Setup verification complete!');
  console.log('📖 See docs/APPWRITE_SETUP.md for detailed setup instructions');
}

// Run the script
main().catch(console.error); 
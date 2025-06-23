#!/usr/bin/env node

/**
 * Add Doubles Support Fields to Matches Collection
 * This script adds playerThreeId and playerFourId fields to the existing matches collection
 */

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-commonjs */
const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function addDoublesFields() {
  try {
    console.log('🎾 Adding doubles support to matches collection...');
    
    const databaseId = process.env.APPWRITE_DATABASE_ID;
    const matchesCollectionId = process.env.APPWRITE_MATCHES_COLLECTION_ID;
    
    console.log(`Database ID: ${databaseId}`);
    console.log(`Collection ID: ${matchesCollectionId}`);
    
    // Add playerThreeId field
    try {
      await databases.createStringAttribute(
        databaseId,
        matchesCollectionId,
        'playerThreeId',
        50,
        false, // not required
        null,  // no default
        false  // not array
      );
      console.log('✅ playerThreeId field added successfully');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('ℹ️  playerThreeId field already exists');
      } else {
        console.error('❌ Error adding playerThreeId:', error.message);
      }
    }
    
    // Add playerFourId field  
    try {
      await databases.createStringAttribute(
        databaseId,
        matchesCollectionId,
        'playerFourId',
        50,
        false, // not required
        null,  // no default
        false  // not array
      );
      console.log('✅ playerFourId field added successfully');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('ℹ️  playerFourId field already exists');
      } else {
        console.error('❌ Error adding playerFourId:', error.message);
      }
    }
    
    // Add isDoubles field
    try {
      await databases.createBooleanAttribute(
        databaseId,
        matchesCollectionId,
        'isDoubles',
        false, // not required
        false  // default value
      );
      console.log('✅ isDoubles field added successfully');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('ℹ️  isDoubles field already exists');
      } else {
        console.error('❌ Error adding isDoubles:', error.message);
      }
    }
    
    // Add detailLevel field
    try {
      await databases.createStringAttribute(
        databaseId,
        matchesCollectionId,
        'detailLevel',
        20, // size
        false, // not required
        'simple',  // default value
        false  // not array
      );
      console.log('✅ detailLevel field added successfully');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('ℹ️  detailLevel field already exists');
      } else {
        console.error('❌ Error adding detailLevel:', error.message);
      }
    }
    
    console.log('\n🎉 Doubles support fields added to matches collection!');
    console.log('🎾 You can now create doubles matches with 4 players.');
    
  } catch (error) {
    console.error('❌ Error adding doubles fields:', error.message);
    process.exit(1);
  }
}

// Run the script
addDoublesFields().catch(console.error); 
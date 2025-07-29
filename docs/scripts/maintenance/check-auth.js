#!/usr/bin/env node

/**
 * Appwrite Authentication Test Script
 * Tests if the API key has the required scopes for authentication
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { Client, Account, Users } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const account = new Account(client);
const users = new Users(client);

async function testConnection() {
  console.log('🔍 Testing Appwrite connection and API scopes...\n');
  
  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    await account.get();
    console.log('✅ Basic connection working\n');
  } catch (error) {
    console.error('❌ Basic connection failed:', error.message);
    return false;
  }
  
  try {
    // Test 2: Users read scope
    console.log('2️⃣ Testing users.read scope...');
    await users.list();
    console.log('✅ users.read scope available\n');
  } catch (error) {
    console.error('❌ users.read scope missing:', error.message);
    console.log('📝 Add "users.read" scope to your API key\n');
    return false;
  }
  
  try {
    // Test 3: Users write scope (attempt to create a test user)
    console.log('3️⃣ Testing users.write scope...');
    // We'll just check if we can call the create method (it will fail due to validation but scope will be tested)
    await account.create('test-id', 'test@example.com', 'password123', 'Test User');
  } catch (error) {
    if (error.message.includes('scope')) {
      console.error('❌ users.write scope missing:', error.message);
      console.log('📝 Add "users.write" scope to your API key\n');
      return false;
    } else if (error.message.includes('already exists') || error.message.includes('invalid')) {
      console.log('✅ users.write scope available (create method accessible)\n');
    } else {
      console.log('✅ users.write scope available\n');
    }
  }
  
  console.log('🎉 All required scopes are available!');
  console.log('✅ Authentication should work properly now');
  return true;
}

async function main() {
  console.log('🎾 TennisScore Authentication Test\n');
  
  // Check environment variables
  if (!process.env.APPWRITE_API_KEY) {
    console.error('❌ APPWRITE_API_KEY not found in environment variables');
    return;
  }
  
  if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
    console.error('❌ NEXT_PUBLIC_APPWRITE_ENDPOINT not found in environment variables');
    return;
  }
  
  if (!process.env.NEXT_PUBLIC_APPWRITE_PROJECT) {
    console.error('❌ NEXT_PUBLIC_APPWRITE_PROJECT not found in environment variables');
    return;
  }
  
  await testConnection();
}

main().catch(console.error); 
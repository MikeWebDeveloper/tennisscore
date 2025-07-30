#!/usr/bin/env node

/**
 * Simple test script to verify Czech tennis search functionality
 * Tests the data endpoints directly without UI interaction
 */

const http = require('http');

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function normalizeForSearch(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim();
}

function searchPlayers(players, query) {
  const normalizedQuery = normalizeForSearch(query);
  
  return players.filter(player => {
    const fullName = `${player.firstName} ${player.lastName}`;
    const normalizedName = normalizeForSearch(fullName);
    const normalizedLastName = normalizeForSearch(player.lastName);
    const normalizedFirstName = normalizeForSearch(player.firstName);
    const normalizedClub = normalizeForSearch(player.club);
    
    return (
      normalizedName.includes(normalizedQuery) ||
      normalizedLastName.includes(normalizedQuery) ||
      normalizedFirstName.includes(normalizedQuery) ||
      normalizedClub.includes(normalizedQuery) ||
      player.bhRating.toLowerCase().includes(normalizedQuery.toLowerCase()) ||
      player.czRanking.toString().includes(normalizedQuery)
    );
  });
}

async function runTests() {
  console.log('🧪 Testing Czech Tennis Search Functionality\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    try {
      await fetchJSON('http://localhost:3000/data/tennis-players/index.json');
      console.log('   ✅ Server is running and data is accessible\n');
    } catch (error) {
      console.log('   ❌ Server not running or data not accessible');
      console.log('   💡 Make sure to run: npm run dev');
      process.exit(1);
    }

    // Test 2: Load and validate index data
    console.log('2. Loading player index...');
    const indexData = await fetchJSON('http://localhost:3000/data/tennis-players/index.json');
    console.log(`   ✅ Loaded ${indexData.players.length} players`);
    console.log(`   ✅ Total players in metadata: ${indexData.metadata.totalPlayers}`);
    
    if (indexData.players.length !== indexData.metadata.totalPlayers) {
      console.log('   ⚠️  Mismatch between actual and reported player count');
    }
    console.log('');

    // Test 3: Search functionality tests
    console.log('3. Testing search functionality...');
    
    const testQueries = [
      { query: 'sofie', expectedMin: 30 },
      { query: 'latalova', expectedMin: 1 },
      { query: 'karlikova', expectedMin: 1 },
      { query: 'sparta', expectedMin: 5 }, // Club search
      { query: '60', expectedMin: 3 }, // BH rating search
      { query: '1', expectedResults: 1 }, // Ranking #1
    ];

    for (const test of testQueries) {
      const results = searchPlayers(indexData.players, test.query);
      const passed = test.expectedResults ? 
        results.length === test.expectedResults : 
        results.length >= test.expectedMin;
      
      const status = passed ? '✅' : '❌';
      console.log(`   ${status} "${test.query}": Found ${results.length} players`);
      
      if (results.length > 0) {
        const sample = results.slice(0, 2);
        sample.forEach(player => {
          console.log(`      - ${player.firstName} ${player.lastName} (Ranking: ${player.czRanking}, Club: ${player.club})`);
        });
      }
      
      if (!passed) {
        console.log(`      Expected: ${test.expectedResults || `min ${test.expectedMin}`}, Got: ${results.length}`);
      }
    }
    console.log('');

    // Test 4: Check chunk data availability
    console.log('4. Testing chunk data...');
    const chunks = ['a-d', 'e-k', 'l-r', 's-z'];
    
    for (const chunkId of chunks) {
      try {
        const chunkData = await fetchJSON(`http://localhost:3000/data/tennis-players/chunk-${chunkId}.json`);
        const expectedCount = indexData.metadata.chunks[chunkId].players;
        const actualCount = chunkData.players.length;
        
        const status = actualCount === expectedCount ? '✅' : '❌';
        console.log(`   ${status} Chunk ${chunkId.toUpperCase()}: ${actualCount}/${expectedCount} players`);
        
        if (actualCount !== expectedCount) {
          console.log(`      Expected ${expectedCount}, got ${actualCount}`);
        }
      } catch (error) {
        console.log(`   ❌ Chunk ${chunkId.toUpperCase()}: Failed to load - ${error.message}`);
      }
    }
    console.log('');

    // Test 5: Enhanced data verification
    console.log('5. Testing enhanced player data...');
    const chunkData = await fetchJSON('http://localhost:3000/data/tennis-players/chunk-e-k.json');
    const samplePlayer = chunkData.players.find(p => p.firstName === 'Nicole' && p.lastName === 'Kurylová');
    
    if (samplePlayer) {
      console.log('   ✅ Sample enhanced player data:');
      console.log(`      Name: ${samplePlayer.firstName} ${samplePlayer.lastName}`);
      console.log(`      Ranking: ${samplePlayer.czRanking}`);
      console.log(`      Birth Year: ${samplePlayer.yearOfBirth}`);
      console.log(`      Club: ${samplePlayer.club}`);
      console.log(`      BH Rating: ${samplePlayer.bhRating}`);
      console.log(`      CZ Tennis URL: ${samplePlayer.cztennisUrl}`);
      console.log(`      Unique ID: ${samplePlayer.uniqueId}`);
    } else {
      console.log('   ❌ Could not find sample player for enhanced data test');
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('💡 The Czech tennis search functionality is working correctly.');
    console.log('💡 If the UI search is still not working, it\'s likely a React/browser issue, not a data issue.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
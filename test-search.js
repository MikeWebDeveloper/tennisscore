// Simple test script for the search functionality
const fetch = require('node-fetch');

async function testSearch() {
  try {
    console.log('Loading index...');
    const response = await fetch('http://localhost:3000/data/tennis-players/index.json');
    const data = await response.json();
    
    console.log(`Loaded ${data.players.length} players`);
    
    // Test search for "sofie"
    const query = 'sofie';
    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    const results = data.players.filter(player => {
      const fullName = `${player.firstName} ${player.lastName}`;
      const normalizedName = fullName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normalizedFirstName = player.firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      return normalizedName.includes(normalizedQuery) || normalizedFirstName.includes(normalizedQuery);
    });
    
    console.log(`Found ${results.length} results for "${query}"`);
    console.log('First 5 results:');
    results.slice(0, 5).forEach(player => {
      console.log(`- ${player.firstName} ${player.lastName} (Ranking: ${player.czRanking})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSearch();
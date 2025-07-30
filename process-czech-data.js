const fs = require('fs');
const path = require('path');

// Read and parse the CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Skip header line
  const dataLines = lines.slice(1).filter(line => line.trim());
  
  const players = [];
  
  dataLines.forEach((line, index) => {
    try {
      // Parse CSV with potential commas in quotes
      const columns = parseCSVLine(line);
      
      if (columns.length >= 12) {
        const czRanking = parseInt(columns[1]) || 0;
        const lastName = cleanString(columns[2]);
        const firstName = cleanString(columns[3]);
        const yearOfBirth = parseInt(columns[4]) || 0;
        const club = cleanString(columns[5]);
        const bhRating = cleanString(columns[9]);
        const cztennisUrl = cleanString(columns[11]);
        const uniqueId = cleanString(columns[12]);
        
        // Only add if we have essential data
        if (lastName && firstName && uniqueId && czRanking > 0) {
          players.push({
            czRanking,
            lastName,
            firstName,
            yearOfBirth,
            club: club || 'Unknown Club',
            bhRating: bhRating || '0BH',
            cztennisUrl: cztennisUrl || '',
            uniqueId
          });
        }
      }
    } catch (error) {
      console.error(`Error parsing line ${index + 2}:`, error.message);
    }
  });
  
  return players;
}

// Simple CSV parser that handles quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Clean string values
function cleanString(str) {
  if (!str) return '';
  return str.replace(/"/g, '').trim();
}

// Group players into alphabetical chunks
function groupPlayersIntoChunks(players) {
  const chunks = {
    'a-d': [],
    'e-k': [],
    'l-r': [],
    's-z': []
  };
  
  players.forEach(player => {
    const firstLetter = player.lastName.charAt(0).toLowerCase();
    
    if (firstLetter >= 'a' && firstLetter <= 'd') {
      chunks['a-d'].push(player);
    } else if (firstLetter >= 'e' && firstLetter <= 'k') {
      chunks['e-k'].push(player);
    } else if (firstLetter >= 'l' && firstLetter <= 'r') {
      chunks['l-r'].push(player);
    } else if (firstLetter >= 's' && firstLetter <= 'z') {
      chunks['s-z'].push(player);
    } else {
      // Handle special characters - put in 's-z' chunk
      chunks['s-z'].push(player);
    }
  });
  
  return chunks;
}

// Create index file
function createIndexFile(players) {
  const indexPlayers = players.map(player => ({
    czRanking: player.czRanking,
    lastName: player.lastName,
    firstName: player.firstName,
    club: player.club,
    bhRating: player.bhRating,
    uniqueId: player.uniqueId,
    chunk: getChunkForPlayer(player.lastName)
  }));
  
  return {
    metadata: {
      category: "U12 Girls Czech Rankings - Complete Dataset",
      lastUpdated: new Date().toISOString().split('T')[0],
      source: "Czech Tennis Association",
      totalPlayers: players.length,
      chunks: {
        'a-d': { range: 'A-D', players: 0 },
        'e-k': { range: 'E-K', players: 0 },
        'l-r': { range: 'L-R', players: 0 },
        's-z': { range: 'S-Z', players: 0 }
      }
    },
    players: indexPlayers
  };
}

function getChunkForPlayer(lastName) {
  const firstLetter = lastName.charAt(0).toLowerCase();
  
  if (firstLetter >= 'a' && firstLetter <= 'd') return 'a-d';
  if (firstLetter >= 'e' && firstLetter <= 'k') return 'e-k';
  if (firstLetter >= 'l' && firstLetter <= 'r') return 'l-r';
  return 's-z';
}

// Main processing
const csvFile = '/Users/michallatal/Desktop/Production-Apps/tennisscore/czech-tennis-full-data.csv';
const outputDir = '/Users/michallatal/Desktop/Production-Apps/tennisscore/src/data/tennis-players';

console.log('Processing Czech tennis data...');

// Parse the CSV
const players = parseCSV(csvFile);
console.log(`Parsed ${players.length} players`);

// Sort by ranking
players.sort((a, b) => a.czRanking - b.czRanking);

// Group into chunks
const chunks = groupPlayersIntoChunks(players);

// Create index
const index = createIndexFile(players);

// Update chunk counts in index
Object.keys(chunks).forEach(chunkId => {
  index.metadata.chunks[chunkId].players = chunks[chunkId].length;
});

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write index file
fs.writeFileSync(
  path.join(outputDir, 'index.json'),
  JSON.stringify(index, null, 2)
);

// Write chunk files
Object.keys(chunks).forEach(chunkId => {
  const chunkData = {
    metadata: {
      chunkId,
      range: chunkId.toUpperCase(),
      totalPlayers: chunks[chunkId].length,
      lastUpdated: new Date().toISOString().split('T')[0]
    },
    players: chunks[chunkId]
  };
  
  fs.writeFileSync(
    path.join(outputDir, `chunk-${chunkId}.json`),
    JSON.stringify(chunkData, null, 2)
  );
  
  console.log(`Created chunk-${chunkId}.json with ${chunks[chunkId].length} players`);
});

console.log('✅ Processing complete!');
console.log(`Total players: ${players.length}`);
console.log('Chunk distribution:');
Object.keys(chunks).forEach(chunkId => {
  console.log(`  ${chunkId.toUpperCase()}: ${chunks[chunkId].length} players`);
});
const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

// Test the break point logic directly
function testBreakPointLogic() {
  console.log('\n🧪 Testing Break Point Logic:');
  
  // Import the function (simulate it)
  const isBreakPoint = (serverPoints, returnerPoints, noAd = false) => {
    if (noAd) {
      return returnerPoints >= 3 && returnerPoints >= serverPoints
    }
    
    if (returnerPoints >= 3 && serverPoints < 3) return true // 40-0, 40-15, 40-30
    if (returnerPoints >= 3 && serverPoints >= 3 && returnerPoints > serverPoints) return true // Ad-40
    return false
  }

  const tests = [
    { server: 0, returner: 3, expected: true, desc: '0-40' },
    { server: 1, returner: 3, expected: true, desc: '15-40' },
    { server: 2, returner: 3, expected: true, desc: '30-40' },
    { server: 3, returner: 0, expected: false, desc: '40-0 (not BP)' },
    { server: 3, returner: 1, expected: false, desc: '40-15 (not BP)' },
    { server: 3, returner: 2, expected: false, desc: '40-30 (not BP)' },
    { server: 3, returner: 3, expected: false, desc: '40-40 (deuce, not BP)' },
    { server: 3, returner: 4, expected: true, desc: '40-AD' },
    { server: 4, returner: 3, expected: false, desc: 'AD-40 (not BP)' },
  ];

  tests.forEach(test => {
    const result = isBreakPoint(test.server, test.returner);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`  ${status} ${test.desc}: Expected ${test.expected}, Got ${result}`);
  });
}

async function testBreakPoints() {
  // First run unit tests
  testBreakPointLogic();

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    // Get matches ordered by update time
    const matches = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID,
      [
        Query.orderDesc('$updatedAt'),
        Query.limit(10)
      ]
    );

    console.log(`\n📋 Found ${matches.documents.length} matches\n`);

    // Find a match with points
    let matchWithPoints = null;
    for (const match of matches.documents) {
      if (match.pointLog && match.pointLog.length > 0) {
        matchWithPoints = match;
        break;
      }
    }

    if (!matchWithPoints) {
      console.log('No matches with points found');
      return;
    }

    const match = matchWithPoints;
    console.log('\n🎾 Match:', match.playerOneId, 'vs', match.playerTwoId);
    console.log('Match ID:', match.$id);
    console.log('Status:', match.status);
    
    // Parse point log - handle JSON strings
    const rawPointLog = match.pointLog;
    console.log(`\n📊 Raw pointLog length: ${rawPointLog.length}`);
    
    // Parse each point if it's a JSON string
    const parsedPointLog = rawPointLog.map((point, index) => {
      if (typeof point === 'string') {
        try {
          return JSON.parse(point);
        } catch (e) {
          console.warn(`Failed to parse point ${index}:`, e.message);
          return null;
        }
      }
      return point;
    }).filter(p => p !== null);

    console.log(`📊 Parsed points: ${parsedPointLog.length}`);

    // Count BP/SP/MP
    const breakPoints = parsedPointLog.filter(p => p.isBreakPoint);
    console.log(`\n🔴 Break Points: ${breakPoints.length}`);
    
    // Show summary of what SHOULD be break points vs what IS marked
    console.log('\n📊 Break Point Analysis Summary:');
    const shouldBeBreakPoints = [];
    const actualBreakPoints = [];
    
    parsedPointLog.forEach(point => {
      // Manual BP check
      const scores = point.gameScore.split('-');
      if (scores.length === 2) {
        const p1Score = parseInt(scores[0]);
        const p2Score = parseInt(scores[1]);
        
        // Convert tennis scores to numbers
        const convertScore = (score) => {
          if (score === 0 || score === '0') return 0;
          if (score === 15) return 1;
          if (score === 30) return 2;
          if (score === 40) return 3;
          if (score === 'AD') return 4;
          return parseInt(score) || 0;
        };
        
        const p1Num = convertScore(p1Score);
        const p2Num = convertScore(p2Score);
        
        const serverNum = point.server === 'p1' ? p1Num : p2Num;
        const returnerNum = point.server === 'p1' ? p2Num : p1Num;
        
        // Check if this should be a BP
        const shouldBeBP = (
          (returnerNum >= 3 && serverNum < 3) || // 40-0, 40-15, 40-30
          (returnerNum >= 3 && serverNum >= 3 && returnerNum > serverNum) // Ad out
        );
        
        if (shouldBeBP) {
          shouldBeBreakPoints.push(point);
        }
        if (point.isBreakPoint) {
          actualBreakPoints.push(point);
        }
      }
    });
    
    console.log(`Should be BP: ${shouldBeBreakPoints.length} points`);
    console.log(`Actually marked BP: ${actualBreakPoints.length} points`);
    console.log(`Missing BPs: ${shouldBeBreakPoints.length - actualBreakPoints.length}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

testBreakPoints(); 
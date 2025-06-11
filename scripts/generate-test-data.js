const { Client, Databases, ID } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('68460965002524f1942e')
  .setKey('standard_5d27448541f96076e4660dcbdf68bdee9f7abaac87355e90ff6593e3882a3b9da4e5acd2ef514718c63af2639551aa0700b2841de6d66c9ebd101b6cc667e8b48d51c46123f79d4d3d1ef5145002a676264cfa59b825ac986056844050ee82b3ce7de30c8860226ede179dab0c1927218e1bbc676f459e4accc93ddebf57f01c');

const databases = new Databases(client);

function generateMatchPoints() {
  const points = [];
  let pointNumber = 1;

  // Set 1: 6-4 (Michal wins)
  // Game 1: Michal holds serve 
  points.push(...generateGamePoints({p1: 4, p2: 1}, pointNumber, 1, 1, false, false));
  pointNumber += 5;

  // Game 2: Opponent holds serve
  points.push(...generateGamePoints({p1: 1, p2: 4}, pointNumber, 1, 2, false, false));
  pointNumber += 5;

  // Game 3: Michal holds serve
  points.push(...generateGamePoints({p1: 4, p2: 2}, pointNumber, 1, 3, false, false));
  pointNumber += 6;

  // Game 4: Opponent holds serve
  points.push(...generateGamePoints({p1: 2, p2: 4}, pointNumber, 1, 4, false, false));
  pointNumber += 6;

  // Game 5: Michal holds serve
  points.push(...generateGamePoints({p1: 4, p2: 1}, pointNumber, 1, 5, false, false));
  pointNumber += 5;

  // Game 6: Opponent holds serve
  points.push(...generateGamePoints({p1: 3, p2: 4}, pointNumber, 1, 6, false, false));
  pointNumber += 7;

  // Game 7: Michal holds serve
  points.push(...generateGamePoints({p1: 4, p2: 0}, pointNumber, 1, 7, false, false));
  pointNumber += 4;

  // Game 8: Opponent holds serve
  points.push(...generateGamePoints({p1: 2, p2: 4}, pointNumber, 1, 8, false, false));
  pointNumber += 6;

  // Game 9: Michal holds serve
  points.push(...generateGamePoints({p1: 4, p2: 2}, pointNumber, 1, 9, false, false));
  pointNumber += 6;

  // Game 10: Michal breaks to win set 6-4
  points.push(...generateGamePoints({p1: 4, p2: 2}, pointNumber, 1, 10, true, false));
  pointNumber += 6;

  // Set 2: 6-3 (Michal wins)
  // Game 1: Michal holds serve
  points.push(...generateGamePoints({p1: 4, p2: 1}, pointNumber, 2, 1, false, false));
  pointNumber += 5;

  // Game 2: Opponent holds serve
  points.push(...generateGamePoints({p1: 2, p2: 4}, pointNumber, 2, 2, false, false));
  pointNumber += 6;

  // Game 3: Michal holds serve
  points.push(...generateGamePoints({p1: 4, p2: 2}, pointNumber, 2, 3, false, false));
  pointNumber += 6;

  // Game 4: Michal breaks
  points.push(...generateGamePoints({p1: 4, p2: 3}, pointNumber, 2, 4, false, false));
  pointNumber += 7;

  // Game 5: Michal holds serve
  points.push(...generateGamePoints({p1: 4, p2: 1}, pointNumber, 2, 5, false, false));
  pointNumber += 5;

  // Game 6: Opponent holds serve
  points.push(...generateGamePoints({p1: 1, p2: 4}, pointNumber, 2, 6, false, false));
  pointNumber += 5;

  // Game 7: Michal holds serve
  points.push(...generateGamePoints({p1: 4, p2: 2}, pointNumber, 2, 7, false, false));
  pointNumber += 6;

  // Game 8: Michal breaks to win match
  points.push(...generateGamePoints({p1: 4, p2: 1}, pointNumber, 2, 8, false, false));
  pointNumber += 5;

  // Game 9: Michal serves out the match 6-3
  points.push(...generateGamePoints({p1: 4, p2: 1}, pointNumber, 2, 9, true, true));

  return points;
}

function generateGamePoints(gameResult, startingPointNumber, setNumber, gameNumber, isLastGameOfSet, isLastGameOfMatch) {
  const points = [];
  let pointNumber = startingPointNumber;
  
  // Determine who wins this game and server
  const gameWinner = gameResult.p1 > (gameResult.p2 || 0) ? "p1" : "p2";
  const server = gameNumber % 2 === 1 ? "p1" : "p2"; // Alternate serve each game
  
  // Generate 4-6 points per game (realistic tennis game length)
  const totalPointsPlayed = gameResult.p1 + (gameResult.p2 || 0);
  const numPoints = Math.max(4, totalPointsPlayed);
  
  for (let i = 0; i < numPoints; i++) {
    const isLastPoint = i === numPoints - 1;
    const winner = isLastPoint ? gameWinner : (Math.random() > 0.5 ? "p1" : "p2");
    
    const point = {
      id: `point_${pointNumber}`,
      timestamp: new Date().toISOString(),
      pointNumber,
      setNumber,
      gameNumber,
      gameScore: generateGameScore(i, gameResult),
      winner,
      server,
      serveType: Math.random() > 0.7 ? "second" : "first",
      serveOutcome: getRandomServeOutcome(),
      pointOutcome: getRandomPointOutcome(),
      rallyLength: Math.floor(Math.random() * 8) + 2, // 2-9 shots
      isBreakPoint: server !== winner && isLastPoint,
      isSetPoint: isLastGameOfSet && isLastPoint,
      isMatchPoint: isLastGameOfMatch && isLastGameOfSet && isLastPoint,
      isGameWinning: isLastPoint,
      isSetWinning: isLastGameOfSet && isLastPoint,
      isMatchWinning: isLastGameOfMatch && isLastGameOfSet && isLastPoint,
      courtPosition: Math.random() > 0.5 ? "deuce" : "ad"
    };
    
    points.push(point);
    pointNumber++;
  }
  
  return points;
}

function generateGameScore(pointIndex, gameResult) {
  const scores = ["0", "15", "30", "40"];
  
  // Simplified game score generation
  if (pointIndex === 0) return "0-0";
  if (pointIndex === 1) return "15-0";
  if (pointIndex === 2) return "30-15";
  if (pointIndex === 3) return "40-30";
  
  return "40-30"; // Default for longer games
}

function getRandomServeOutcome() {
  const outcomes = ["winner", "unforced_error", "forced_error", "ace"];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

function getRandomPointOutcome() {
  const outcomes = ["winner", "unforced_error", "forced_error", "ace", "double_fault"];
  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

async function updateMatchWithPointData() {
  try {
    const matchId = "68494c7fd65b648766ae"; // The completed test match
    const points = generateMatchPoints();
    
    // Convert points to strings for Appwrite (since it expects string arrays)
    const serializedPoints = points.map(point => JSON.stringify(point));
    
    console.log(`Generated ${points.length} detailed points for match ${matchId}`);
    
    const result = await databases.updateDocument(
      'tennisscore_db',
      'matches',
      matchId,
      {
        pointLog: serializedPoints
      }
    );
    
    console.log('Successfully updated match with detailed point data!');
    console.log(`Updated match: ${result.$id}`);
    
  } catch (error) {
    console.error('Error updating match:', error);
  }
}

// Run the script
updateMatchWithPointData(); 
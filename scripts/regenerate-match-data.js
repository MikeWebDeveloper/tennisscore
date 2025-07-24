require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

// Initialize Appwrite
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Tennis scoring helper functions
function getTennisScore(p1Points, p2Points) {
  const scoreMap = ["0", "15", "30", "40"];
  
  // Handle deuce and advantage
  if (p1Points >= 3 && p2Points >= 3) {
    if (p1Points === p2Points) {
      return "40-40"; // Deuce
    } else if (p1Points > p2Points) {
      return "AD-40"; // Advantage player 1
    } else {
      return "40-AD"; // Advantage player 2
    }
  }
  
  // Standard scoring
  const p1Score = p1Points >= 4 ? "40" : scoreMap[p1Points];
  const p2Score = p2Points >= 4 ? "40" : scoreMap[p2Points];
  
  return `${p1Score}-${p2Score}`;
}

function isGameComplete(score) {
  const { p1, p2 } = score;
  
  // Standard game: win by 2, at least 4 points
  if (Math.max(p1, p2) >= 4) {
    return Math.abs(p1 - p2) >= 2;
  }
  
  return false;
}

function generateGamePoints(gameResult, startingPointNumber, setNumber, gameNumber, isLastGameOfSet, isLastGameOfMatch) {
  const points = [];
  let pointNumber = startingPointNumber;
  
  // Determine who wins this game and server
  const gameWinner = gameResult.p1 > (gameResult.p2 || 0) ? "p1" : "p2";
  const server = gameNumber % 2 === 1 ? "p1" : "p2"; // Alternate serve each game
  
  // Track actual tennis score progression
  let currentScore = { p1: 0, p2: 0 };
  let pointIndex = 0;
  
  // Play points until someone wins the game
  while (true) {
    // Get the game score BEFORE this point is played
    const gameScore = getTennisScore(currentScore.p1, currentScore.p2);
    
    const isGameWinningPoint = isGameComplete(currentScore);
    if (isGameWinningPoint) break;
    
    // Determine point winner - bias towards game winner as we approach the end
    const shouldGameWinnerWin = (
      (gameWinner === "p1" && currentScore.p1 >= 3) ||
      (gameWinner === "p2" && currentScore.p2 >= 3) ||
      Math.random() < 0.6
    );
    const winner = shouldGameWinnerWin ? gameWinner : (Math.random() > 0.5 ? "p1" : "p2");
    
    // Create point detail
    const point = {
      id: `point_${pointNumber}`,
      timestamp: new Date(Date.now() + pointNumber * 30000).toISOString(),
      pointNumber,
      setNumber,
      gameNumber,
      gameScore, // This is the score BEFORE the point
      winner,
      server,
      serveType: Math.random() < 0.65 ? "first" : "second",
      serveOutcome: "winner", // Simplified for now
      servePlacement: ["wide", "body", "t"][Math.floor(Math.random() * 3)],
      serveSpeed: Math.floor(Math.random() * 40) + 160,
      rallyLength: Math.floor(Math.random() * 10) + 1,
      pointOutcome: "winner",
      lastShotType: "forehand",
      lastShotPlayer: winner,
      isBreakPoint: false,
      isSetPoint: isLastGameOfSet && isGameComplete({ ...currentScore, [winner]: currentScore[winner] + 1 }),
      isMatchPoint: isLastGameOfMatch && isGameComplete({ ...currentScore, [winner]: currentScore[winner] + 1 }),
      isGameWinning: isGameComplete({ ...currentScore, [winner]: currentScore[winner] + 1 }),
      isSetWinning: false,
      isMatchWinning: false,
      notes: undefined,
      courtPosition: "baseline"
    };
    
    points.push(point);
    
    // Award the point AFTER creating the point detail
    currentScore[winner]++;
    
    pointNumber++;
    pointIndex++;
    
    // Safety check to prevent infinite loops
    if (pointIndex > 20) break;
  }
  
  return points;
}

function generateMatchPoints() {
  const points = [];
  let pointNumber = 1;
  let setNumber = 1;
  let gameNumber = 1;
  
  // Set 1: 6-4 (Player 1 wins)
  const set1Games = [
    { p1: 1, p2: 0 }, { p1: 1, p2: 1 }, { p1: 2, p2: 1 }, { p1: 2, p2: 2 },
    { p1: 3, p2: 2 }, { p1: 3, p2: 3 }, { p1: 4, p2: 3 }, { p1: 4, p2: 4 },
    { p1: 5, p2: 4 }, { p1: 6, p2: 4 }
  ];

  // Set 2: 6-3 (Player 1 wins)
  const set2Games = [
    { p1: 1, p2: 0 }, { p1: 1, p2: 1 }, { p1: 2, p2: 1 }, { p1: 3, p2: 1 },
    { p1: 3, p2: 2 }, { p1: 4, p2: 2 }, { p1: 4, p2: 3 }, { p1: 5, p2: 3 },
    { p1: 6, p2: 3 }
  ];

  const allSets = [set1Games, set2Games];
  
  allSets.forEach((setGames, setIndex) => {
    setNumber = setIndex + 1;
    gameNumber = 1;
    
    setGames.forEach((gameResult, gameIndex) => {
      const isLastGameOfSet = gameIndex === setGames.length - 1;
      const isLastGameOfMatch = setIndex === 1 && isLastGameOfSet;
      
      // Generate points for this game
      const gamePoints = generateGamePoints(
        gameResult, 
        pointNumber, 
        setNumber, 
        gameNumber,
        isLastGameOfSet,
        isLastGameOfMatch
      );
      
      points.push(...gamePoints);
      pointNumber += gamePoints.length;
      gameNumber++;
    });
  });

  return points;
}

async function updateMatchData() {
  try {
    const matchId = "68494c7fd65b648766ae"; // Replace with actual match ID
    const detailedPoints = generateMatchPoints();
    
    // Serialize points for Appwrite storage
    const serializedPointLog = detailedPoints.map(point => JSON.stringify(point));

    // Update the match with detailed point data
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_MATCHES_COLLECTION_ID,
      matchId,
      {
        pointLog: serializedPointLog
      }
    );

    console.log(`✅ Successfully updated match ${matchId} with ${detailedPoints.length} points`);
    console.log("First few points:", detailedPoints.slice(0, 5).map(p => `${p.gameScore} → ${p.winner} wins`));
  } catch (error) {
    console.error("❌ Error updating match data:", error);
  }
}

updateMatchData(); 
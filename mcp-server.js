#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Client, Account, Databases, Storage, Users } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client();
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const users = new Users(client);

// Configure Appwrite
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

const databaseId = process.env.APPWRITE_DATABASE_ID || 'main';
const playersCollectionId = process.env.APPWRITE_PLAYERS_COLLECTION_ID || 'players';
const matchesCollectionId = process.env.APPWRITE_MATCHES_COLLECTION_ID || 'matches';
const usersCollectionId = process.env.APPWRITE_USERS_COLLECTION_ID || 'users';

class TennisScoreServer {
  constructor() {
    this.server = new Server(
      {
        name: 'tennisscore-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_players',
            description: 'Get all players from the tennis score database',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Maximum number of players to return',
                  default: 100,
                },
              },
            },
          },
          {
            name: 'get_matches',
            description: 'Get matches from the tennis score database',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Maximum number of matches to return',
                  default: 100,
                },
                playerId: {
                  type: 'string',
                  description: 'Filter matches by player ID',
                },
              },
            },
          },
          {
            name: 'get_match_details',
            description: 'Get detailed information about a specific match',
            inputSchema: {
              type: 'object',
              properties: {
                matchId: {
                  type: 'string',
                  description: 'The ID of the match to retrieve',
                  required: true,
                },
              },
              required: ['matchId'],
            },
          },
          {
            name: 'get_player_stats',
            description: 'Get comprehensive statistics for a player',
            inputSchema: {
              type: 'object',
              properties: {
                playerId: {
                  type: 'string',
                  description: 'The ID of the player to get stats for',
                  required: true,
                },
              },
              required: ['playerId'],
            },
          },
          {
            name: 'create_player',
            description: 'Create a new player in the database',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Player name',
                  required: true,
                },
                email: {
                  type: 'string',
                  description: 'Player email',
                },
                handedness: {
                  type: 'string',
                  enum: ['left', 'right'],
                  description: 'Player handedness',
                },
                backhand: {
                  type: 'string',
                  enum: ['one-handed', 'two-handed'],
                  description: 'Backhand style',
                },
              },
              required: ['name'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_players':
            return await this.getPlayers(args);
          case 'get_matches':
            return await this.getMatches(args);
          case 'get_match_details':
            return await this.getMatchDetails(args);
          case 'get_player_stats':
            return await this.getPlayerStats(args);
          case 'create_player':
            return await this.createPlayer(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async getPlayers(args) {
    const { limit = 100 } = args;
    
    try {
      const response = await databases.listDocuments(
        databaseId,
        playersCollectionId,
        [],
        limit
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.documents, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get players: ${error.message}`);
    }
  }

  async getMatches(args) {
    const { limit = 100, playerId } = args;
    
    try {
      const queries = [];
      if (playerId) {
        queries.push(`player1=${playerId}`);
        queries.push(`player2=${playerId}`);
      }

      const response = await databases.listDocuments(
        databaseId,
        matchesCollectionId,
        queries,
        limit
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.documents, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get matches: ${error.message}`);
    }
  }

  async getMatchDetails(args) {
    const { matchId } = args;
    
    try {
      const match = await databases.getDocument(
        databaseId,
        matchesCollectionId,
        matchId
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(match, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get match details: ${error.message}`);
    }
  }

  async getPlayerStats(args) {
    const { playerId } = args;
    
    try {
      // Get player info
      const player = await databases.getDocument(
        databaseId,
        playersCollectionId,
        playerId
      );

      // Get matches for this player
      const matches = await databases.listDocuments(
        databaseId,
        matchesCollectionId,
        [`player1=${playerId}`, `player2=${playerId}`],
        1000
      );

      // Calculate basic stats
      const stats = {
        player: player,
        totalMatches: matches.documents.length,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
      };

      matches.documents.forEach(match => {
        if (match.status === 'completed') {
          const isPlayer1 = match.player1.$id === playerId;
          const playerScore = isPlayer1 ? match.player1Score : match.player2Score;
          const opponentScore = isPlayer1 ? match.player2Score : match.player1Score;

          // Count sets won/lost
          if (playerScore && opponentScore) {
            stats.setsWon += playerScore.reduce((sum, set) => sum + (set > opponentScore[stats.setsWon] ? 1 : 0), 0);
            stats.setsLost += opponentScore.reduce((sum, set) => sum + (set > playerScore[stats.setsLost] ? 1 : 0), 0);
          }

          // Determine match winner
          if (match.winnerId === playerId) {
            stats.wins++;
          } else {
            stats.losses++;
          }
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get player stats: ${error.message}`);
    }
  }

  async createPlayer(args) {
    const { name, email, handedness, backhand } = args;
    
    try {
      const playerData = {
        name,
        email: email || null,
        handedness: handedness || 'right',
        backhand: backhand || 'two-handed',
        createdAt: new Date().toISOString(),
      };

      const response = await databases.createDocument(
        databaseId,
        playersCollectionId,
        'unique()',
        playerData
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create player: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Tennis Score MCP server running on stdio');
  }
}

const server = new TennisScoreServer();
server.run().catch(console.error);
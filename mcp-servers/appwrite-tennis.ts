#!/usr/bin/env node

import { Client, Databases, Account, Users, Query } from 'node-appwrite';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  apiKey: string;
  databaseId: string;
  playersCollectionId: string;
  matchesCollectionId: string;
  usersCollectionId: string;
}

class AppwriteTennisMCPServer {
  private server: Server;
  private client: Client;
  private databases: Databases;
  private account: Account;
  private users: Users;
  private config: AppwriteConfig;

  constructor() {
    this.server = new Server(
      {
        name: 'appwrite-tennis',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Appwrite configuration
    this.config = {
      endpoint: process.env.APPWRITE_ENDPOINT || '',
      projectId: process.env.APPWRITE_PROJECT_ID || '',
      apiKey: process.env.APPWRITE_API_KEY || '',
      databaseId: process.env.APPWRITE_DATABASE_ID || '',
      playersCollectionId: process.env.APPWRITE_PLAYERS_COLLECTION_ID || '',
      matchesCollectionId: process.env.APPWRITE_MATCHES_COLLECTION_ID || '',
      usersCollectionId: process.env.APPWRITE_USERS_COLLECTION_ID || '',
    };

    // Initialize Appwrite client
    this.client = new Client()
      .setEndpoint(this.config.endpoint)
      .setProject(this.config.projectId)
      .setKey(this.config.apiKey);

    this.databases = new Databases(this.client);
    this.account = new Account(this.client);
    this.users = new Users(this.client);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_collection_schema',
          description: 'Get the schema and attributes of a collection',
          inputSchema: {
            type: 'object',
            properties: {
              collectionId: {
                type: 'string',
                description: 'Collection ID to inspect',
              },
            },
            required: ['collectionId'],
          },
        },
        {
          name: 'list_players',
          description: 'List players from the database',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of players to return (default: 10)',
                default: 10,
              },
              offset: {
                type: 'number',
                description: 'Offset for pagination (default: 0)',
                default: 0,
              },
              search: {
                type: 'string',
                description: 'Search term for player names',
              },
            },
          },
        },
        {
          name: 'get_player',
          description: 'Get a specific player by ID',
          inputSchema: {
            type: 'object',
            properties: {
              playerId: {
                type: 'string',
                description: 'Player ID',
              },
            },
            required: ['playerId'],
          },
        },
        {
          name: 'add_collection_attributes',
          description: 'Add missing attributes to a collection',
          inputSchema: {
            type: 'object',
            properties: {
              collectionId: {
                type: 'string',
                description: 'Collection ID to update',
              },
              attributes: {
                type: 'array',
                description: 'Array of attributes to add',
                items: {
                  type: 'object',
                  properties: {
                    key: { type: 'string' },
                    type: { type: 'string', enum: ['string', 'integer', 'float', 'boolean', 'datetime', 'email', 'ip', 'url'] },
                    required: { type: 'boolean', default: false },
                    array: { type: 'boolean', default: false },
                    size: { type: 'number' },
                    default: { type: 'string' },
                  },
                  required: ['key', 'type'],
                },
              },
            },
            required: ['collectionId', 'attributes'],
          },
        },
        {
          name: 'list_matches',
          description: 'List matches from the database',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of matches to return (default: 10)',
                default: 10,
              },
              offset: {
                type: 'number',
                description: 'Offset for pagination (default: 0)',
                default: 0,
              },
              status: {
                type: 'string',
                description: 'Filter by match status',
                enum: ['pending', 'in-progress', 'completed', 'retired'],
              },
            },
          },
        },
        {
          name: 'update_player',
          description: 'Update a player with new attributes',
          inputSchema: {
            type: 'object',
            properties: {
              playerId: {
                type: 'string',
                description: 'Player ID to update',
              },
              data: {
                type: 'object',
                description: 'Data to update',
              },
            },
            required: ['playerId', 'data'],
          },
        },
        {
          name: 'execute_database_query',
          description: 'Execute a custom database query',
          inputSchema: {
            type: 'object',
            properties: {
              collectionId: {
                type: 'string',
                description: 'Collection ID to query',
              },
              queries: {
                type: 'array',
                description: 'Array of Appwrite query objects',
                items: {
                  type: 'string',
                  description: 'Query string (e.g., "Query.equal(\'userId\', \'123\')")',
                },
              },
            },
            required: ['collectionId'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!args) {
        throw new McpError(ErrorCode.InvalidParams, `Missing arguments for tool: ${name}`);
      }

      try {
        switch (name) {
          case 'get_collection_schema':
            return await this.getCollectionSchema((args as any).collectionId);

          case 'list_players':
            return await this.listPlayers((args as any).limit || 10, (args as any).offset || 0, (args as any).search);

          case 'get_player':
            return await this.getPlayer((args as any).playerId);

          case 'add_collection_attributes':
            return await this.addCollectionAttributes((args as any).collectionId, (args as any).attributes);

          case 'list_matches':
            return await this.listMatches((args as any).limit || 10, (args as any).offset || 0, (args as any).status);

          case 'update_player':
            return await this.updatePlayer((args as any).playerId, (args as any).data);

          case 'execute_database_query':
            return await this.executeDatabaseQuery((args as any).collectionId, (args as any).queries || []);

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new McpError(ErrorCode.InternalError, `Error executing ${name}: ${message}`);
      }
    });
  }

  private async getCollectionSchema(collectionId: string) {
    try {
      const collection = await this.databases.getCollection(this.config.databaseId, collectionId);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              collection: {
                id: collection.$id,
                name: collection.name,
                enabled: collection.enabled,
                documentSecurity: collection.documentSecurity,
                attributes: collection.attributes,
                indexes: collection.indexes,
              }
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting collection schema: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async listPlayers(limit: number, offset: number, search?: string) {
    try {
      const queries = [Query.limit(limit), Query.offset(offset), Query.orderDesc('$createdAt')];
      
      if (search) {
        queries.push(Query.search('firstName', search));
      }

      const players = await this.databases.listDocuments(
        this.config.databaseId,
        this.config.playersCollectionId,
        queries
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              total: players.total,
              players: players.documents.map(player => ({
                id: player.$id,
                firstName: player.firstName,
                lastName: player.lastName,
                yearOfBirth: player.yearOfBirth,
                bhRating: player.bhRating,
                czRanking: player.czRanking,
                club: player.club,
                cztennisUrl: player.cztennisUrl,
                czechTennisId: player.czechTennisId,
                isImportedFromCzech: player.isImportedFromCzech,
                rating: player.rating,
                isMainPlayer: player.isMainPlayer,
                createdAt: player.$createdAt,
              })),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing players: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getPlayer(playerId: string) {
    try {
      const player = await this.databases.getDocument(
        this.config.databaseId,
        this.config.playersCollectionId,
        playerId
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(player, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting player: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async addCollectionAttributes(collectionId: string, attributes: any[]) {
    try {
      const results = [];
      
      for (const attr of attributes) {
        try {
          let result;
          
          switch (attr.type) {
            case 'string':
              result = await this.databases.createStringAttribute(
                this.config.databaseId,
                collectionId,
                attr.key,
                attr.size || 255,
                attr.required || false,
                attr.default,
                attr.array || false
              );
              break;
            case 'integer':
              result = await this.databases.createIntegerAttribute(
                this.config.databaseId,
                collectionId,
                attr.key,
                attr.required || false,
                attr.min,
                attr.max,
                attr.default,
                attr.array || false
              );
              break;
            case 'float':
              result = await this.databases.createFloatAttribute(
                this.config.databaseId,
                collectionId,
                attr.key,
                attr.required || false,
                attr.min,
                attr.max,
                attr.default,
                attr.array || false
              );
              break;
            case 'boolean':
              result = await this.databases.createBooleanAttribute(
                this.config.databaseId,
                collectionId,
                attr.key,
                attr.required || false,
                attr.default,
                attr.array || false
              );
              break;
            case 'datetime':
              result = await this.databases.createDatetimeAttribute(
                this.config.databaseId,
                collectionId,
                attr.key,
                attr.required || false,
                attr.default,
                attr.array || false
              );
              break;
            case 'email':
              result = await this.databases.createEmailAttribute(
                this.config.databaseId,
                collectionId,
                attr.key,
                attr.required || false,
                attr.default,
                attr.array || false
              );
              break;
            case 'url':
              result = await this.databases.createUrlAttribute(
                this.config.databaseId,
                collectionId,
                attr.key,
                attr.required || false,
                attr.default,
                attr.array || false
              );
              break;
            default:
              throw new Error(`Unsupported attribute type: ${attr.type}`);
          }
          
          results.push({ success: true, attribute: attr.key, result });
        } catch (error) {
          results.push({ 
            success: false, 
            attribute: attr.key, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ results }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error adding collection attributes: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async listMatches(limit: number, offset: number, status?: string) {
    try {
      const queries = [Query.limit(limit), Query.offset(offset), Query.orderDesc('$createdAt')];
      
      if (status) {
        queries.push(Query.equal('status', status));
      }

      const matches = await this.databases.listDocuments(
        this.config.databaseId,
        this.config.matchesCollectionId,
        queries
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              total: matches.total,
              matches: matches.documents.map(match => ({
                id: match.$id,
                playerOneId: match.playerOneId,
                playerTwoId: match.playerTwoId,
                status: match.status,
                score: match.score,
                matchDate: match.matchDate,
                winnerId: match.winnerId,
                createdAt: match.$createdAt,
              })),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error listing matches: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async updatePlayer(playerId: string, data: any) {
    try {
      const updatedPlayer = await this.databases.updateDocument(
        this.config.databaseId,
        this.config.playersCollectionId,
        playerId,
        data
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, player: updatedPlayer }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error updating player: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async executeDatabaseQuery(collectionId: string, queryStrings: string[]) {
    try {
      // This is a simplified implementation - in practice, you'd want to parse query strings safely
      const queries = queryStrings.map(q => {
        // Basic query string parsing - this should be more robust in production
        if (q.includes('Query.limit')) {
          const match = q.match(/Query\.limit\((\d+)\)/);
          return match ? Query.limit(parseInt(match[1])) : Query.limit(25);
        }
        if (q.includes('Query.offset')) {
          const match = q.match(/Query\.offset\((\d+)\)/);
          return match ? Query.offset(parseInt(match[1])) : Query.offset(0);
        }
        if (q.includes('Query.equal')) {
          const match = q.match(/Query\.equal\(['"](.*?)['"],\s*['"](.*?)['"]\)/);
          return match ? Query.equal(match[1], match[2]) : Query.limit(10);
        }
        return Query.limit(10); // Default fallback
      });

      const result = await this.databases.listDocuments(
        this.config.databaseId,
        collectionId,
        queries
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              total: result.total,
              documents: result.documents,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing database query: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Appwrite Tennis MCP server running on stdio');
  }
}

const server = new AppwriteTennisMCPServer();
server.run().catch(console.error);
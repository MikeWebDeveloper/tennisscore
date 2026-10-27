// Read-only contract check for the selected match-list fields.
// Uses local .env files or environment variables; never prints credentials or records.
import { readFile } from 'node:fs/promises'
import nextEnv from '@next/env'
import { Client, Databases, Query } from 'node-appwrite'

nextEnv.loadEnvConfig(process.cwd())
const required = ['NEXT_PUBLIC_APPWRITE_ENDPOINT', 'NEXT_PUBLIC_APPWRITE_PROJECT', 'APPWRITE_API_KEY', 'APPWRITE_DATABASE_ID', 'APPWRITE_MATCHES_COLLECTION_ID']
const missing = required.filter(name => !process.env[name])
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

try {
  const source = await readFile(new URL('../src/lib/utils/match-list-fields.ts', import.meta.url), 'utf8')
  const declaration = source.match(/export const MATCH_LIST_FIELDS\s*=\s*\[([\s\S]*?)\]/)
  if (!declaration) throw new Error('Could not locate MATCH_LIST_FIELDS')
  const fields = [...declaration[1].matchAll(/"([^\"]+)"/g)].map(match => match[1])
  if (!fields.length) throw new Error('No match-list fields found')
  const client = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT).setKey(process.env.APPWRITE_API_KEY)
  const databases = new Databases(client)
  const result = await databases.listAttributes(process.env.APPWRITE_DATABASE_ID, process.env.APPWRITE_MATCHES_COLLECTION_ID, [Query.limit(100)])
  if (result.total > result.attributes.length) throw new Error('Schema contains more than 100 attributes; extend this check to paginate')
  const known = new Set(result.attributes.map(attribute => attribute.key))
  const allowedSystem = new Set(['$id', '$createdAt', '$updatedAt', '$permissions'])
  const unknown = fields.filter(field => field.startsWith('$') ? !allowedSystem.has(field) : !known.has(field))
  if (unknown.length) throw new Error(`Unsupported match-list fields: ${unknown.join(', ')}`)
  console.log(`Appwrite match-list schema OK (${fields.length} selected fields)`)
} catch (error) {
  console.error(`Appwrite schema check failed: ${error instanceof Error ? error.message : 'unknown error'}`)
  process.exitCode = 1
}
